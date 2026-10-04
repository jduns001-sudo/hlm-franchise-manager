'use strict';
const assert = require('assert');
const { GAME_STATE_SCHEMA_VERSION, createGameStateEnvelope, validateGameStateEnvelope } = require('./hlm-game-state');

const input = {
  meta: { saveId: 'SAVE-test', controlledTeamId: 1, currentDate: '2026-07-01' },
  players: [{ id: 10, name: 'Player' }],
  teams: [{ id: 1, name: 'Team' }],
  contracts: [{ contractId: 'CON-one', playerId: 10 }],
  draftPicks: [{ year: 2027, round: 1 }],
  transactions: [{ transactionId: 'TXN-one', type: 'Signing' }]
};
const before = JSON.stringify(input);
const state = createGameStateEnvelope(input);

assert.strictEqual(state.schemaVersion, GAME_STATE_SCHEMA_VERSION);
assert.strictEqual(state.meta.controlledTeamId, 1);
assert.strictEqual(state.universe.players.length, 1);
assert.strictEqual(state.assets.contracts.length, 1);
assert.strictEqual(state.activity.transactions.length, 1);
assert.deepStrictEqual(validateGameStateEnvelope(state), { valid: true, errors: [] });

state.universe.players[0].name = 'Changed';
assert.strictEqual(input.players[0].name, 'Player', 'GameState must not alias source arrays');
assert.strictEqual(JSON.stringify(input), before, 'source input must remain unchanged');

const bad = createGameStateEnvelope();
bad.assets.contracts = {};
const validation = validateGameStateEnvelope(bad);
assert.strictEqual(validation.valid, false);
assert(validation.errors.some(x => x.code === 'STATE_FIELD_NOT_ARRAY'));

console.log('GameState envelope tests passed.');
