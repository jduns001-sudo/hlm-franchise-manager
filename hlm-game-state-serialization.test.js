'use strict';
const assert = require('assert');
const { createGameStateEnvelope } = require('./hlm-game-state');
const { serializeGameState, deserializeGameState, verifyGameStateRoundTrip } = require('./hlm-game-state-serialization');

const state = createGameStateEnvelope({
  meta: { saveId: 'SAVE-roundtrip', controlledTeamId: 1, currentDate: '2026-07-01' },
  players: [{ id: 2, name: 'B' }, { id: 1, name: 'A' }],
  teams: [{ id: 1, name: 'Team' }],
  contracts: [{ contractId: 'CON-one', playerId: 1 }],
  transactions: [{ transactionId: 'TXN-one', playerId: 1, type: 'Signing' }]
});
const before = JSON.stringify(state);
const text = serializeGameState(state);
const loaded = deserializeGameState(text);
const roundTrip = verifyGameStateRoundTrip(state);

assert.deepStrictEqual(loaded, state);
assert.strictEqual(roundTrip.valid, true);
assert(roundTrip.byteLength > 0);
assert.strictEqual(JSON.stringify(state), before, 'serialization must not mutate GameState');

const reordered = { ...state, extensions: state.extensions, finances: state.finances };
assert.strictEqual(serializeGameState(reordered), text, 'object key order must not change serialized output');

assert.throws(() => deserializeGameState('{bad'), err => err.code === 'INVALID_SAVE_JSON');
assert.throws(() => deserializeGameState(''), err => err.code === 'INVALID_SAVE_TEXT');

const future = JSON.parse(text);
future.schemaVersion = 999;
assert.throws(() => deserializeGameState(JSON.stringify(future)), err => err.code === 'UNSUPPORTED_SCHEMA_VERSION');

const malformed = JSON.parse(text);
malformed.assets.contracts = {};
assert.throws(() => deserializeGameState(JSON.stringify(malformed)), err => err.code === 'INVALID_GAME_STATE');

console.log('GameState serialization tests passed.');
