'use strict';

const assert = require('assert');
const { createGameStateEnvelope } = require('./hlm-game-state');
const { calculateAge, resolveDevelopmentInputs } = require('./hlm-player-development-foundation');

const player = {
  id: 101,
  name: 'Foundation Test Player',
  birthYear: 2005,
  position: 'C',
  ovr: 72,
  potential: 'Elite',
  potentialLevel: 'High',
  attributes: { skating: 75, shooting: 71 },
  developmentTraits: { curve: 'normal', workEthic: 80 },
  retired: false
};
const state = createGameStateEnvelope({
  meta: { currentDate: '2026-10-06' },
  players: [player]
});
const before = JSON.stringify(state);

assert.strictEqual(calculateAge(2005, '2026-10-06'), 21);

const first = resolveDevelopmentInputs(state, 101);
const second = resolveDevelopmentInputs(state, 101);
assert.deepStrictEqual(first, second);
assert.strictEqual(first.playerId, 101);
assert.strictEqual(first.currentDate, '2026-10-06');
assert.strictEqual(first.age, 21);
assert.strictEqual(first.overall, 72);
assert.strictEqual(first.potential, 'Elite');
assert.strictEqual(first.potentialLevel, 'High');
assert.deepStrictEqual(first.attributes, { skating: 75, shooting: 71 });
assert.deepStrictEqual(first.developmentTraits, { curve: 'normal', workEthic: 80 });
assert.strictEqual(Object.isFrozen(first), true);
assert.strictEqual(JSON.stringify(state), before, 'development input resolution must not mutate GameState');

assert.throws(() => resolveDevelopmentInputs(state, 0), e => e.code === 'INVALID_PLAYER_ID');
assert.throws(() => resolveDevelopmentInputs(state, 999), e => e.code === 'PLAYER_NOT_FOUND');
assert.throws(() => resolveDevelopmentInputs({}, 101), e => e.code === 'INVALID_GAME_STATE');

const badDate = createGameStateEnvelope({ meta: { currentDate: 'not-a-date' }, players: [player] });
assert.throws(() => resolveDevelopmentInputs(badDate, 101), e => e.code === 'INVALID_DEVELOPMENT_DATE');

const duplicate = createGameStateEnvelope({ meta: { currentDate: '2026-10-06' }, players: [player, { ...player }] });
assert.throws(() => resolveDevelopmentInputs(duplicate, 101), e => e.code === 'DUPLICATE_PLAYER_ID');

const sparse = createGameStateEnvelope({
  meta: { currentDate: '2026-10-06' },
  players: [{ id: 102, name: 'Sparse Player' }]
});
const sparseInputs = resolveDevelopmentInputs(sparse, 102);
assert.strictEqual(sparseInputs.age, null);
assert.strictEqual(sparseInputs.overall, null);
assert.strictEqual(sparseInputs.potential, null);
assert.strictEqual(sparseInputs.attributes, null);

console.log('Player development foundation tests passed.');
