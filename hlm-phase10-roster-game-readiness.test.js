'use strict';
const assert = require('node:assert/strict');
const { createGameStateEnvelope } = require('./hlm-game-state');
const { assessRosterBackedGameReadiness: assess } = require('./hlm-phase10-roster-game-readiness');
const players = [];
for (const [teamId, base] of [[1, 100], [2, 200]]) {
  ['C', 'LW', 'RW', 'D', 'D', 'G'].forEach((position, i) => {
    players.push({ id: base + i, teamId, position, ovr: 75 + teamId });
  });
}
players.push({ id: 999, teamId: -1, position: 'G', ovr: 99 });
const state = createGameStateEnvelope({
  teams: [{ id: 1, name: 'Wolves' }, { id: 2, name: 'Bears' }], players
});
const before = JSON.stringify(state);
const result = assess(state, 1, 2, 42);
assert.equal(result.kind, 'phase10-roster-game-readiness');
assert.equal(result.previewAvailable, true);
assert.equal(result.gameReady, null);
assert.deepEqual(result.homeMissingSlots, []);
assert.deepEqual(result.awayMissingSlots, []);
assert.deepEqual(result.preview.home.playerIds, [100, 101, 102, 103, 104, 105]);
assert.deepEqual(result.preview.away.playerIds, [200, 201, 202, 203, 204, 205]);
assert.deepEqual(assess(state, 1, 2, 42), result);
assert.equal(JSON.stringify(state), before);
for (const flag of ['resultOfficial', 'lineupAuthorized', 'simulationAuthorized', 'sourceStateMutated', 'persistencePerformed']) {
  assert.equal(result[flag], false);
}
result.preview.home.playerIds[0] = 999;
assert.equal(assess(state, 1, 2, 42).preview.home.playerIds[0], 100);
const incomplete = createGameStateEnvelope({
  teams: state.universe.teams, players: players.filter(p => p.id !== 205)
});
const pending = assess(incomplete, 1, 2, 42);
assert.equal(pending.previewAvailable, false);
assert.equal(pending.preview, null);
assert.deepEqual(pending.awayMissingSlots, ['G']);
assert.equal(pending.gameReady, null);
const unknown = assess(state, 1, 3, 42);
assert.equal(unknown.previewAvailable, false);
assert.deepEqual(unknown.awayMissingSlots, ['TEAM_NOT_FOUND']);
for (const [home, away] of [[0, 2], [1, 1], [-1, 2], [1.5, 2]]) {
  assert.throws(() => assess(state, home, away, 42), { code: 'INVALID_ROSTER_GAME_READINESS_TEAMS' });
}
for (const seed of [-1, 1.5, NaN]) {
  assert.throws(() => assess(state, 1, 2, seed), { code: 'INVALID_ROSTER_GAME_READINESS_SEED' });
}
console.log('Mission 724 roster game readiness tests passed.');
