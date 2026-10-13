'use strict';
const assert = require('node:assert/strict');
const { createGameStateEnvelope } = require('./hlm-game-state');
const { createRosterBackedGamePreview: preview } = require('./hlm-phase10-roster-game-preview');

const players = [];
for (const [teamId, base] of [[1, 100], [2, 200]]) {
  for (const [i, position] of ['C', 'LW', 'RW', 'D', 'D', 'G'].entries()) {
    players.push({ id: base + i, teamId, position, ovr: teamId === 1 ? 85 : 75 });
  }
}
players.push({ id: 999, teamId: -1, position: 'G', ovr: 99 });
const state = createGameStateEnvelope({ teams: [{ id: 1, name: 'Wolves' }, { id: 2, name: 'Bears' }], players });
const before = JSON.stringify(state);
const result = preview(state, 1, 2, 42);
assert.equal(result.kind, 'phase10-roster-backed-game-preview');
assert.equal(result.home.rating.skaters, 85);
assert.equal(result.home.rating.goalie, 85);
assert.equal(result.away.rating.skaters, 75);
assert.equal(result.away.rating.goalie, 75);
assert.deepEqual(result.home.playerIds, [100, 101, 102, 103, 104, 105]);
assert.deepEqual(result.away.playerIds, [200, 201, 202, 203, 204, 205]);
assert(Number.isInteger(result.projectedScore.homeGoals));
assert(Number.isInteger(result.projectedScore.awayGoals));
assert(result.projectedScore.homeGoals >= 0 && result.projectedScore.homeGoals <= 9);
assert(result.projectedScore.awayGoals >= 0 && result.projectedScore.awayGoals <= 9);
assert.deepEqual(preview(state, 1, 2, 42), result);
assert.equal(JSON.stringify(state), before);
for (const flag of ['resultOfficial', 'lineupAuthorized', 'simulationAuthorized', 'sourceStateMutated', 'persistencePerformed']) {
  assert.equal(result[flag], false);
}
result.home.playerIds[0] = 999;
result.home.rating.skaters = 0;
assert.equal(preview(state, 1, 2, 42).home.playerIds[0], 100);
assert.equal(JSON.stringify(state), before);
for (const ids of [[1, 1], [1, 3], [0, 2], [-1, 2]]) {
  assert.throws(() => preview(state, ids[0], ids[1], 42));
}
for (const seed of [-1, 1.5, NaN]) {
  assert.throws(() => preview(state, 1, 2, seed), { code: 'INVALID_ROSTER_GAME_PREVIEW_SEED' });
}
const incomplete = createGameStateEnvelope({
  teams: [{ id: 1, name: 'Wolves' }, { id: 2, name: 'Bears' }],
  players: players.filter(p => p.id !== 205)
});
assert.throws(() => preview(incomplete, 1, 2, 42), { code: 'INCOMPLETE_ROSTER_GAME_PREVIEW_LINEUP' });
console.log('Mission 723 roster game preview tests passed.');
