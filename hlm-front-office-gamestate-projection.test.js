'use strict';
const assert = require('assert');
const { createGameStateEnvelope } = require('./hlm-game-state');
const { projectGameStateForFrontOffice } = require('./hlm-front-office-gamestate-projection');

const state = createGameStateEnvelope({
  meta: { saveId: 'mission78', controlledTeamId: 'PIT', currentDate: '2026-10-05' },
  players: [{ id: 'p1', name: 'Player One' }],
  teams: [{ id: 'PIT', name: 'Pittsburgh' }],
  leagues: [{ id: 'league1' }],
  prospects: [{ id: 'prospect1' }],
  staff: [{ id: 'staff1' }],
  contracts: [{ id: 'contract1', playerId: 'p1' }],
  draftPicks: [{ id: 'pick1', ownerTeamId: 'PIT' }],
  transactions: [{ id: 'tx1' }],
  games: [{ id: 'game1' }],
  injuries: [{ id: 'injury1' }],
  seasons: [{ id: 'season1' }],
  statistics: [{ id: 'stats1' }],
  history: [{ id: 'record1' }],
  finances: { cap: 100 },
  extensions: { source: 'schema7' }
});

const projected = projectGameStateForFrontOffice(state);

assert.deepStrictEqual(projected.players, state.universe.players);
assert.deepStrictEqual(projected.teams, state.universe.teams);
assert.deepStrictEqual(projected.contracts, state.assets.contracts);
assert.deepStrictEqual(projected.draftPicks, state.assets.draftPicks);
assert.deepStrictEqual(projected.transactions, state.activity.transactions);
assert.deepStrictEqual(projected.games, state.activity.games);
assert.deepStrictEqual(projected.injuries, state.activity.injuries);
assert.deepStrictEqual(projected.seasons, state.history.seasons);
assert.deepStrictEqual(projected.statistics, state.history.statistics);
assert.deepStrictEqual(projected.history, state.history.records);
assert.strictEqual(projected.settings.controlledTeamId, 'PIT');
assert.strictEqual(projected.gmSettings.controlledTeamId, 'PIT');
assert.strictEqual(projected.gameStateSchemaVersion, 1);

projected.players[0].name = 'Changed Projection';
assert.strictEqual(state.universe.players[0].name, 'Player One');

assert.throws(
  () => projectGameStateForFrontOffice({ schemaVersion: 1 }),
  error => error && error.code === 'INVALID_GAMESTATE_PROJECTION_SOURCE'
);

console.log('Front Office GameState projection tests passed.');
