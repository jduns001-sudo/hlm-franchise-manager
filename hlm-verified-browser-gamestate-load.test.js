'use strict';
const assert = require('assert');
const { createBrowserSaveAdapter, DEFAULT_STORAGE_KEY } = require('./hlm-browser-save-adapter');
const { createGameStateEnvelope } = require('./hlm-game-state');
const { LEGACY_LOCAL_STORAGE_KEY } = require('./hlm-schema7-browser-gamestate-bridge');
const { loadVerifiedBrowserGameState } = require('./hlm-verified-browser-gamestate-load');

function createStorage(seed = {}) {
  const data = { ...seed };
  return {
    getItem(key) { return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null; },
    setItem(key, value) { data[key] = String(value); },
    removeItem(key) { delete data[key]; },
    snapshot() { return JSON.stringify(data); }
  };
}

const legacy = JSON.stringify({ schema: 7, notes: { gm: 'keep' } });
const storage = createStorage({ [LEGACY_LOCAL_STORAGE_KEY]: legacy });
const repository = createBrowserSaveAdapter(storage, DEFAULT_STORAGE_KEY);
const state = createGameStateEnvelope({ meta: { saveId: 'verified-slot', controlledTeamId: 5 } });
repository.save('verified-slot', state, { label: 'Mission 64' });

const before = storage.snapshot();
const loaded = loadVerifiedBrowserGameState(storage, 'verified-slot');
assert.strictEqual(loaded.loaded, true);
assert.strictEqual(loaded.verified, true);
assert.strictEqual(loaded.schemaVersion, 1);
assert.strictEqual(loaded.state.meta.saveId, 'verified-slot');
assert.strictEqual(loaded.writePerformed, false);
assert.strictEqual(loaded.sourceMutationAllowed, false);
assert.strictEqual(loaded.sourceDeletionAllowed, false);
assert.deepStrictEqual(loaded.blockers, []);
assert.strictEqual(storage.snapshot(), before);
assert.strictEqual(storage.getItem(LEGACY_LOCAL_STORAGE_KEY), legacy);

const missingBefore = storage.snapshot();
const missing = loadVerifiedBrowserGameState(storage, 'missing-slot');
assert.strictEqual(missing.loaded, false);
assert.strictEqual(missing.verified, false);
assert.strictEqual(missing.state, null);
assert(missing.blockers.includes('Save slot not found'));
assert.strictEqual(storage.snapshot(), missingBefore);

const invalidSlot = loadVerifiedBrowserGameState(storage, '   ');
assert.strictEqual(invalidSlot.loaded, false);
assert(invalidSlot.blockers.includes('Save slot ID is required'));

const corruptStorage = createStorage({
  [LEGACY_LOCAL_STORAGE_KEY]: legacy,
  [DEFAULT_STORAGE_KEY]: JSON.stringify({ corrupt: '{"format":"HFM_SAVE","formatVersion":1,"integrity":{"algorithm":"fnv1a32","payloadHash":"00000000"},"payload":"{}"}' })
});
const corruptBefore = corruptStorage.snapshot();
const corrupt = loadVerifiedBrowserGameState(corruptStorage, 'corrupt');
assert.strictEqual(corrupt.loaded, false);
assert.strictEqual(corrupt.verified, false);
assert.strictEqual(corrupt.state, null);
assert(corrupt.blockers.includes('Save payload integrity check failed'));
assert.strictEqual(corruptStorage.snapshot(), corruptBefore);

const badIndexStorage = createStorage({
  [LEGACY_LOCAL_STORAGE_KEY]: legacy,
  [DEFAULT_STORAGE_KEY]: '{not-json'
});
const badIndexBefore = badIndexStorage.snapshot();
const badIndex = loadVerifiedBrowserGameState(badIndexStorage, 'anything');
assert.strictEqual(badIndex.loaded, false);
assert.strictEqual(badIndex.verified, false);
assert(badIndex.blockers.includes('Browser save index is invalid JSON'));
assert.strictEqual(badIndexStorage.snapshot(), badIndexBefore);

const repeated = loadVerifiedBrowserGameState(storage, 'verified-slot');
assert.deepStrictEqual(repeated, loaded);
assert.strictEqual(storage.snapshot(), before);

console.log('Verified browser GameState load tests passed.');
