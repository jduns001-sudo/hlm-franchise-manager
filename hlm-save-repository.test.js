'use strict';
const assert = require('assert');
const { createGameStateEnvelope } = require('./hlm-game-state');
const { createMemorySaveRepository } = require('./hlm-save-repository');

const repo = createMemorySaveRepository();
const state = createGameStateEnvelope({
  meta: { saveId: 'SAVE-one', controlledTeamId: 5, currentDate: '2026-07-01' },
  players: [{ id: 1, name: 'Player' }],
  teams: [{ id: 5, name: 'Team' }]
});
const before = JSON.stringify(state);

repo.save('slot-1', state, { label: 'Franchise One' });
assert.strictEqual(repo.count(), 1);
assert.strictEqual(repo.has('slot-1'), true);
assert.strictEqual(repo.list()[0].metadata.label, 'Franchise One');
assert.deepStrictEqual(repo.load('slot-1').state, state);
assert.strictEqual(JSON.stringify(state), before);

assert.throws(() => repo.save('slot-1', state), err => err.code === 'SAVE_SLOT_EXISTS');
repo.save('slot-1', state, { label: 'Replacement' }, { replace: true });
assert.strictEqual(repo.list()[0].metadata.label, 'Replacement');

assert.throws(() => repo.load('missing'), err => err.code === 'SAVE_SLOT_NOT_FOUND');
assert.throws(() => repo.remove('missing'), err => err.code === 'SAVE_SLOT_NOT_FOUND');

assert.deepStrictEqual(repo.remove('slot-1'), { slotId: 'slot-1', removed: true });
assert.strictEqual(repo.count(), 0);
assert.strictEqual(repo.has('slot-1'), false);

console.log('Memory save repository tests passed.');
