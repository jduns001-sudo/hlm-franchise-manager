'use strict';
const assert = require('node:assert/strict');
const { createGameStateEnvelope } = require('./hlm-game-state');
const { createRosterBackedGameInput: build } = require('./hlm-phase10-roster-game-input');
const positions = ['C', 'LW', 'RW', 'D', 'D', 'G'];
const state = createGameStateEnvelope({
  teams: [{ id: 1, name: 'Wolves' }, { id: 2, name: 'Bears' }],
  players: [
    ...positions.map((position, i) => ({ id: 10 + i, teamId: 1, position, ovr: 80 + i })),
    ...positions.map((position, i) => ({ id: 20 + i, teamId: 2, position, ovr: 70 + i })),
    { id: 30, teamId: -1, position: 'G', ovr: 99 }
  ],
  contracts: Array.from({ length: 12 }, (_, i) => ({
    playerId: i < 6 ? 10 + i : 20 + i - 6,
    teamId: i < 6 ? 1 : 2, status: 'Active'
  })),
  injuries: Array.from({ length: 12 }, (_, i) => ({
    playerId: i < 6 ? 10 + i : 20 + i - 6, status: 'Recovered'
  }))
});
const before = JSON.stringify(state);
const complete = build(state, 1, 2);
assert.equal(complete.kind, 'phase10-roster-backed-game-input');
assert.equal(complete.evidenceComplete, true);
assert.equal(complete.home.inputComplete, true);
assert.equal(complete.away.inputComplete, true);
assert.equal(complete.home.proposedRatingCount, 6);
assert.equal(complete.away.proposedRatingSum, 435);
assert.deepEqual(complete.home.blockers, []);
assert.equal(complete.home.gameEligible, null);
for (const flag of ['eligibilityCertified', 'simulationAuthorized', 'scoreCalculated',
  'sourceStateMutated', 'persistencePerformed']) assert.equal(complete[flag], false);
assert.equal(JSON.stringify(state), before);
assert.deepEqual(build(state, 1, 2), complete);
const blocked = createGameStateEnvelope({
  teams: state.universe.teams,
  players: state.universe.players,
  contracts: state.assets.contracts.filter(c => c.playerId !== 20),
  injuries: state.activity.injuries
});
const incomplete = build(blocked, 1, 2);
assert.equal(incomplete.evidenceComplete, false);
assert.equal(incomplete.away.inputComplete, false);
assert(incomplete.away.blockers.some(b => b.playerId === 20));
assert.equal(incomplete.simulationAuthorized, false);
incomplete.away.blockers[0].code = 'TAMPER';
complete.home.proposedPlayerIds.push(999);
assert.equal(JSON.stringify(state), before);
assert.equal(build(state, 1, 2).home.proposedPlayerIds.includes(999), false);
assert.throws(() => build(state, 1, 1), { code: 'INVALID_PHASE10_MATCHUP_TEAM_IDS' });
assert.throws(() => build(state, 1, 999), { code: 'UNKNOWN_PHASE10_MATCHUP_TEAM_ID' });
console.log('Mission 738 roster-backed game input tests passed.');
