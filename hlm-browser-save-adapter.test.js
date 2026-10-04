'use strict';
const assert = require('assert');
const { createGameStateEnvelope } = require('./hlm-game-state');
const { DEFAULT_STORAGE_KEY, createBrowserSaveAdapter } = require('./hlm-browser-save-adapter');

function memoryStorage(seed = {}) {
  const data = { ...seed };
  return {
    getItem: key => Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null,
    setItem: (key, value) => { data[key] = String(value); },
    removeItem: key => { delete data[key]; },
    snapshot: () => ({ ...data })
  };
}

const legacyKey = 'hlm_tracker_v3';
const storage = memoryStorage({ [legacyKey]: 'legacy-data-must-survive' });
const adapter = createBrowserSaveAdapter(storage);
const state = createGameStateEnvelope({
  meta: { saveId: 'SAVE-browser', controlledTeamId: 5, currentDate: '2026-07-01' },
  players: [{ id: 1, name: 'Player' }],
  teams: [{ id: 5, name: 'Team' }]
});

adapter.save('slot-1', state, { label: 'Browser Test' });
assert.strictEqual(adapter.storageKey, DEFAULT_STORAGE_KEY);
assert.strictEqual(adapter.has('slot-1'), true);
assert.strictEqual(adapter.list()[0].metadata.label, 'Browser Test');
assert.deepStrictEqual(adapter.load('slot-1').state, state);
assert.strictEqual(storage.snapshot()[legacyKey], 'legacy-data-must-survive');

assert.throws(() => adapter.save('slot-1', state), err => err.code === 'SAVE_SLOT_EXISTS');
adapter.save('slot-1', state, { label: 'Replacement' }, { replace: true });
assert.strictEqual(adapter.list()[0].metadata.label, 'Replacement');

adapter.remove('slot-1');
assert.strictEqual(adapter.has('slot-1'), false);
assert.strictEqual(storage.snapshot()[legacyKey], 'legacy-data-must-survive');
assert.strictEqual(storage.snapshot()[DEFAULT_STORAGE_KEY], undefined);

console.log('Browser save adapter tests passed.');
