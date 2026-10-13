'use strict';
const assert = require('node:assert/strict');
const { createGameStateEnvelope } = require('./hlm-game-state');
const { assessOfficialRosterGameIntegration: assess } = require('./hlm-phase10-official-roster-game-gate');

const players = [];
for (const [teamId, base] of [[1, 100], [2, 200]]) {
  ['C', 'LW', 'RW', 'D', 'D', 'G'].forEach((position, index) => {
    players.push({ id: base + index, teamId, position, ovr: 75 + index });
  });
}
const state = createGameStateEnvelope({
  teams: [{ id: 1, name: 'Wolves' }, { id: 2, name: 'Bears' }],
  players,
  games: [
    { id: 'G1', date: '2026-10-14', status: 'scheduled', homeTeamId: 1, awayTeamId: 2 },
    { id: 'G2', date: '2026-10-15', status: 'final', homeTeamId: 2, awayTeamId: 1,
      homeGoals: 2, awayGoals: 1 }
  ]
});
const original = JSON.stringify(state);
const report = assess(state, 17);
assert.equal(report.kind, 'phase10-official-roster-game-integration-gate');
assert.equal(report.scheduledGameCount, 1);
assert.equal(report.previewAvailableCount, 1);
assert.equal(report.blockedGameCount, 1);
assert.equal(report.officialResultCount, 0);
assert.equal(report.games[0].gameId, 'G1');
assert.equal(report.games[0].canApplyOfficialResult, false);
assert(report.games[0].blockers.includes('OFFICIAL_GAME_RULES_NOT_AUTHORIZED'));
assert.deepEqual(assess(state, 17), report);
for (const flag of ['simulationAuthorized', 'sourceStateMutated', 'persistencePerformed']) {
  assert.equal(report[flag], false);
}
assert.equal(JSON.stringify(state), original);
report.games[0].blockers.push('TAMPER');
assert.equal(JSON.stringify(state), original);
assert(!JSON.stringify(assess(state, 17)).includes('TAMPER'));
const missing = createGameStateEnvelope({
  teams: state.universe.teams, players: players.filter(p => p.id !== 105),
  games: state.activity.games
});
assert.equal(assess(missing, 17).previewAvailableCount, 0);
assert(assess(missing, 17).games[0].blockers.includes('ROSTER_PREVIEW_UNAVAILABLE'));
assert.equal(assess(createGameStateEnvelope()).scheduledGameCount, 0);
const invalid = createGameStateEnvelope();
invalid.schemaVersion = 99;
assert.throws(() => assess(invalid), { code: 'INVALID_SEASON_ROSTER_PREVIEW_STATE' });
console.log('Mission 728 official game integration gate tests passed.');
