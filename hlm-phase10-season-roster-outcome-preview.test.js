'use strict';
const assert = require('node:assert/strict');
const { createGameStateEnvelope } = require('./hlm-game-state');
const { createSeasonRosterOutcomePreview: preview } = require('./hlm-phase10-season-roster-outcome-preview');

const players = [];
for (const [teamId, base] of [[1, 100], [2, 200], [3, 300]]) {
  ['C', 'LW', 'RW', 'D', 'D', 'G'].forEach((position, i) =>
    players.push({ id: base + i, teamId, position, ovr: 78 + i }));
}
const games = [
  { id: 'G1', status: 'scheduled', date: '2026-10-14', homeTeamId: 1, awayTeamId: 2 },
  { id: 'OLD', status: 'final', date: '2026-10-12', homeTeamId: 2, awayTeamId: 3,
    homeGoals: 2, awayGoals: 1 },
  { id: 'G2', status: 'scheduled', date: '2026-10-15', homeTeamId: 3, awayTeamId: 1 }
];
const state = createGameStateEnvelope({
  meta: { currentDate: '2026-10-13' },
  teams: [{ id: 1, name: 'Wolves' }, { id: 2, name: 'Bears' }, { id: 3, name: 'Falcons' }],
  players, games
});
const original = JSON.stringify(state);
const result = preview(state, 12);
assert.equal(result.kind, 'phase10-season-roster-outcome-preview');
assert.equal(result.scheduledGameCount, 2);
assert.equal(result.proposedCount, 2);
assert.equal(result.unavailableCount, 0);
assert.deepEqual(result.games.map(g => [g.gameId, g.date, g.seed]),
  [['G1', '2026-10-14', 12], ['G2', '2026-10-15', 13]]);
assert.deepEqual(preview(state, 12), result);
assert.equal(JSON.stringify(state), original);
for (const flag of ['resultOfficial', 'simulationAuthorized', 'sourceStateMutated', 'persistencePerformed']) {
  assert.equal(result[flag], false);
}
result.games[0].outcome.regulationScore.homeGoals = 999;
result.games[0].homeMissingSlots.push('TAMPER');
assert.equal(JSON.stringify(state), original);
assert.notEqual(preview(state, 12).games[0].outcome.regulationScore.homeGoals, 999);
const partial = createGameStateEnvelope({
  teams: state.universe.teams, players: players.filter(p => p.id !== 305), games
});
assert.equal(preview(partial, 12).unavailableCount, 1);
assert.equal(preview(createGameStateEnvelope(), 0).scheduledGameCount, 0);
const invalid = createGameStateEnvelope();
invalid.schemaVersion = 999;
assert.throws(() => preview(invalid), { code: 'INVALID_SEASON_ROSTER_PREVIEW_STATE' });
assert.throws(() => preview(state, -1), { code: 'INVALID_ROSTER_GAME_BATCH_SEED' });
console.log('Mission 727 season roster outcome preview tests passed.');
