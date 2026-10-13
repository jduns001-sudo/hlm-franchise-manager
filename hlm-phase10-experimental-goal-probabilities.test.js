'use strict';
const assert = require('node:assert/strict');
const { createGameStateEnvelope } = require('./hlm-game-state');
const { createExperimentalGoalProbabilityPreview: preview } = require('./hlm-phase10-experimental-goal-probabilities');

const positions = ['C', 'LW', 'RW', 'D', 'D', 'G'];
const players = [
  ...positions.map((position, i) => ({ id: 10 + i, teamId: 1, position, ovr: 80 })),
  ...positions.map((position, i) => ({ id: 20 + i, teamId: 2, position, ovr: 70 }))
];
const contracts = players.map(p => ({ playerId: p.id, teamId: p.teamId, status: 'Active' }));
const injuries = players.map(p => ({ playerId: p.id, status: 'Recovered' }));
const state = createGameStateEnvelope({
  teams: [{ id: 1, name: 'Wolves' }, { id: 2, name: 'Bears' }],
  players, contracts, injuries
});
const original = JSON.stringify(state);
const result = preview(state, 1, 2);
assert.equal(result.kind, 'phase10-experimental-goal-probability-preview');
assert.equal(result.evidenceComplete, true);
assert.equal(result.homeExpectedGoals, 3.05);
assert.equal(result.awayExpectedGoals, 2.15);
for (const key of ['homeWinProbability', 'tieProbability', 'awayWinProbability']) {
  assert(Number.isFinite(result[key]) && result[key] > 0 && result[key] < 1);
}
assert(result.homeWinProbability > result.awayWinProbability);
assert(Math.abs(result.homeWinProbability + result.tieProbability + result.awayWinProbability - 1) < 1e-12);
assert.deepEqual(preview(state, 1, 2), result);
const reverse = preview(state, 2, 1);
assert(reverse.homeWinProbability < reverse.awayWinProbability);
for (const flag of ['eligibilityCertified', 'simulationAuthorized', 'scoreCalculated',
  'gameResultCreated', 'sourceStateMutated', 'persistencePerformed']) {
  assert.equal(result[flag], false);
}
assert.equal(JSON.stringify(state), original);
const missing = createGameStateEnvelope({
  teams: state.universe.teams, players, contracts: contracts.filter(c => c.playerId !== 20), injuries
});
const blocked = preview(missing, 1, 2);
assert.equal(blocked.evidenceComplete, false);
assert.equal(blocked.homeWinProbability, null);
assert.equal(blocked.tieProbability, null);
assert.equal(blocked.awayWinProbability, null);
assert(blocked.awayBlockers.some(b => b.playerId === 20));
blocked.awayBlockers[0].code = 'TAMPER';
assert(!JSON.stringify(preview(missing, 1, 2)).includes('TAMPER'));
assert.throws(() => preview(state, 1, 1), { code: 'INVALID_PHASE10_MATCHUP_TEAM_IDS' });
assert.throws(() => preview(state, 1, 999), { code: 'UNKNOWN_PHASE10_MATCHUP_TEAM_ID' });
console.log('Mission 741 experimental goal probability tests passed.');
