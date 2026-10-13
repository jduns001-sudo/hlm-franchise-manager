'use strict';
const assert = require('node:assert/strict');
const { createGameStateEnvelope } = require('./hlm-game-state');
const { createRosterBackedGameOutcomeBatch: batch } = require('./hlm-phase10-roster-game-outcome-batch');
const { createRosterBackedGameOutcomeProposal: single } = require('./hlm-phase10-roster-game-outcome-proposal');

const players = [];
for (const [teamId, base] of [[1, 100], [2, 200], [3, 300]]) {
  ['C', 'LW', 'RW', 'D', 'D', 'G'].forEach((position, i) =>
    players.push({ id: base + i, teamId, position, ovr: 78 + i }));
}
const state = createGameStateEnvelope({
  teams: [{ id: 1, name: 'Wolves' }, { id: 2, name: 'Bears' }, { id: 3, name: 'Falcons' }],
  players
});
const games = [
  { id: 'G1', homeTeamId: 1, awayTeamId: 2 },
  { id: 'G2', homeTeamId: 3, awayTeamId: 1 },
  { id: 'G3', homeTeamId: 2, awayTeamId: 3 }
];
const before = JSON.stringify(state);
const result = batch(state, games, 42);
assert.equal(result.kind, 'phase10-roster-game-outcome-batch');
assert.equal(result.gameCount, 3);
assert.equal(result.proposedCount, 3);
assert.equal(result.unavailableCount, 0);
assert.deepEqual(result.proposals.map(p => p.gameId), ['G1', 'G2', 'G3']);
assert.deepEqual(result.proposals.map(p => p.seed), [42, 43, 44]);
for (let i = 0; i < games.length; i++) {
  assert.deepEqual(result.proposals[i].outcome,
    single(state, games[i].homeTeamId, games[i].awayTeamId, 42 + i).outcome);
}
assert.deepEqual(batch(state, games, 42), result);
assert.equal(JSON.stringify(state), before);
for (const flag of ['resultOfficial', 'simulationAuthorized', 'sourceStateMutated', 'persistencePerformed']) {
  assert.equal(result[flag], false);
}
const incomplete = createGameStateEnvelope({
  teams: state.universe.teams, players: players.filter(p => p.id !== 305)
});
const partial = batch(incomplete, games, 3);
assert.equal(partial.gameCount, 3);
assert.equal(partial.proposedCount, 1);
assert.equal(partial.unavailableCount, 2);
assert.equal(partial.proposals[1].outcome, null);
assert.deepEqual(partial.proposals[1].homeMissingSlots, ['G']);
assert.deepEqual(batch(state, [], 1).proposals, []);
result.proposals[0].outcome.regulationScore.homeGoals = 999;
result.proposals[0].homeMissingSlots.push('TAMPER');
assert.equal(JSON.stringify(state), before);
assert.notEqual(batch(state, games, 42).proposals[0].outcome.regulationScore.homeGoals, 999);
for (const invalid of [null, {}, 'bad']) {
  assert.throws(() => batch(state, invalid), { code: 'INVALID_ROSTER_GAME_BATCH' });
}
for (const invalid of [-1, 1.5, NaN, Number.MAX_SAFE_INTEGER]) {
  assert.throws(() => batch(state, games, invalid), { code: 'INVALID_ROSTER_GAME_BATCH_SEED' });
}
for (const invalid of [[null], [{ id: 'G1', homeTeamId: 1, awayTeamId: 1 }],
  [{ id: 'G1', homeTeamId: 1, awayTeamId: 2 }, { id: 'G1', homeTeamId: 2, awayTeamId: 3 }]]) {
  assert.throws(() => batch(state, invalid), { code: 'INVALID_ROSTER_GAME_BATCH_ENTRY' });
}
console.log('Mission 726 roster outcome batch tests passed.');
