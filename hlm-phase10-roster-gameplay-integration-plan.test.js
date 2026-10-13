'use strict';
const assert = require('node:assert/strict');
const { createGameStateEnvelope } = require('./hlm-game-state');
const { createRosterGameplayIntegrationPlan: plan } = require('./hlm-phase10-roster-gameplay-integration-plan');

const players = [];
for (const [teamId, base] of [[1, 100], [2, 200]]) {
  ['C', 'LW', 'RW', 'D', 'D', 'G'].forEach((position, index) =>
    players.push({ id: base + index, teamId, position, ovr: 80 }));
}
const state = createGameStateEnvelope({
  teams: [{ id: 1, name: 'Wolves' }, { id: 2, name: 'Bears' }], players
});
const original = JSON.stringify(state);
const result = plan(state, 1, 2, 4);
assert.equal(result.kind, 'phase10-roster-gameplay-integration-plan');
assert.equal(result.previewAvailable, true);
assert(result.calculatedResult);
assert.equal(result.blockerCount, 4);
assert.deepEqual(result.steps.map(step => step.action), [
  'verify-league-participation',
  'verify-player-contract-injury-status',
  'implement-lineup-authorization',
  'implement-official-result-commit'
]);
assert.deepEqual(result.steps.map(step => step.order), [1, 2, 3, 4]);
assert(result.steps.every(step => step.resolved === false));
assert.equal(result.nextAction, 'verify-league-participation');
assert.deepEqual(plan(state, 1, 2, 4), result);
const incomplete = createGameStateEnvelope({
  teams: state.universe.teams, players: players.filter(p => p.id !== 205)
});
const missing = plan(incomplete, 1, 2, 4);
assert.equal(missing.previewAvailable, false);
assert.equal(missing.calculatedResult, null);
assert.deepEqual(missing.missingSlots.away, ['G']);
assert.equal(missing.steps[0].blocker, 'INCOMPLETE_STARTER_PROPOSALS');
const unresolved = createGameStateEnvelope({
  teams: state.universe.teams,
  players: players.concat({ id: 999, teamId: -1, position: 'C', ovr: 70 })
});
const diagnostic = plan(unresolved, 1, 2, 4);
assert(diagnostic.blockers.includes('FRANCHISE_IDENTITY_DIAGNOSTICS'));
assert.equal(diagnostic.steps[0].action, 'resolve-franchise-identity');
for (const flag of ['gameReady', 'resultOfficial', 'authorizationIssued',
  'lineupAuthorized', 'simulationAuthorized', 'sourceStateMutated', 'persistencePerformed']) {
  assert.equal(result[flag], false);
}
result.steps[0].action = 'TAMPER';
result.blockers.push('TAMPER');
result.missingSlots.home.push('TAMPER');
result.calculatedResult.homeGoals = 999;
assert.equal(JSON.stringify(state), original);
assert(!JSON.stringify(plan(state, 1, 2, 4)).includes('TAMPER'));
for (const [home, away] of [[0, 2], [1, 1], [-1, 2]]) {
  assert.throws(() => plan(state, home, away), { code: 'INVALID_ROSTER_GAME_READINESS_TEAMS' });
}
for (const seed of [-1, NaN, 1.5]) {
  assert.throws(() => plan(state, 1, 2, seed), { code: 'INVALID_ROSTER_GAME_READINESS_SEED' });
}
console.log('Mission 733 gameplay integration plan tests passed.');
