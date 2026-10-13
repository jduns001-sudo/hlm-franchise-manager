'use strict';
const assert = require('node:assert/strict');
const { createGameStateEnvelope } = require('./hlm-game-state');
const { assessRosterGamePreviewEligibility: assess } = require('./hlm-phase10-roster-game-preview-eligibility');

const players = [];
for (const [teamId, base] of [[1, 100], [2, 200]]) {
  ['C', 'LW', 'RW', 'D', 'D', 'G'].forEach((position, index) =>
    players.push({ id: base + index, teamId, position, ovr: 80 }));
}
const state = createGameStateEnvelope({
  teams: [{ id: 1, name: 'Wolves' }, { id: 2, name: 'Bears' }], players
});
const original = JSON.stringify(state);
const report = assess(state, 1, 2, 4);
assert.equal(report.kind, 'phase10-roster-game-preview-eligibility-review');
assert.equal(report.previewAvailable, true);
assert(report.calculatedResult);
assert.equal(report.gameReady, false);
assert.deepEqual(report.blockers, [
  'LEAGUE_ELIGIBILITY_UNVERIFIED',
  'PLAYER_CONTRACT_INJURY_STATUS_UNVERIFIED',
  'LINEUP_AUTHORIZATION_NOT_IMPLEMENTED',
  'OFFICIAL_RESULT_COMMIT_NOT_IMPLEMENTED'
]);
assert.equal(report.blockerCount, 4);
assert.deepEqual(assess(state, 1, 2, 4), report);
for (const flag of ['resultOfficial', 'authorizationIssued', 'lineupAuthorized',
  'simulationAuthorized', 'sourceStateMutated', 'persistencePerformed']) {
  assert.equal(report[flag], false);
}
const incomplete = createGameStateEnvelope({
  teams: state.universe.teams, players: players.filter(p => p.id !== 205)
});
const blocked = assess(incomplete, 1, 2, 4);
assert.equal(blocked.previewAvailable, false);
assert.equal(blocked.calculatedResult, null);
assert.equal(blocked.blockers[0], 'INCOMPLETE_STARTER_PROPOSALS');
assert.deepEqual(blocked.awayMissingSlots, ['G']);
const unknown = assess(state, 1, 3, 4);
assert.equal(unknown.previewAvailable, false);
assert.deepEqual(unknown.awayMissingSlots, ['TEAM_NOT_FOUND']);
const unresolved = createGameStateEnvelope({
  teams: state.universe.teams,
  players: players.concat({ id: 999, teamId: -1, position: 'C', ovr: 75 })
});
const diagnostic = assess(unresolved, 1, 2, 4);
assert.equal(diagnostic.previewAvailable, true);
assert(diagnostic.blockers.includes('FRANCHISE_IDENTITY_DIAGNOSTICS'));
assert.equal(JSON.stringify(state), original);
report.blockers.push('TAMPER');
report.calculatedResult.homeGoals = 999;
assert(!JSON.stringify(assess(state, 1, 2, 4)).includes('TAMPER'));
assert.notEqual(assess(state, 1, 2, 4).calculatedResult.homeGoals, 999);
for (const [home, away] of [[0, 2], [1, 1], [-1, 2]]) {
  assert.throws(() => assess(state, home, away), { code: 'INVALID_ROSTER_GAME_READINESS_TEAMS' });
}
for (const seed of [-1, NaN, 1.5]) {
  assert.throws(() => assess(state, 1, 2, seed), { code: 'INVALID_ROSTER_GAME_READINESS_SEED' });
}
console.log('Mission 732 roster game preview eligibility tests passed.');
