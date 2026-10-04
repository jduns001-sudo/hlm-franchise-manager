'use strict';
const assert = require('assert');
const { DEFAULT_STORAGE_KEY } = require('./hlm-browser-save-adapter');
const { LEGACY_LOCAL_STORAGE_KEY } = require('./hlm-schema7-browser-gamestate-bridge');
const {
  createBrowserMigrationRecoveryCheckpoint,
  restoreBrowserMigrationRecoveryCheckpoint
} = require('./hlm-browser-migration-recovery-checkpoint');

function createStorage(seed = {}) {
  const data = { ...seed };
  return {
    getItem(key) { return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null; },
    setItem(key, value) { data[key] = String(value); },
    removeItem(key) { delete data[key]; },
    snapshot() { return JSON.stringify(data); }
  };
}

const legacy = JSON.stringify({ schema: 7, settings: { controlledTeamId: 5 }, notes: { gm: 'keep' } });
const saves = JSON.stringify({ existing: '{"preserve":true}' });
const storage = createStorage({
  [LEGACY_LOCAL_STORAGE_KEY]: legacy,
  [DEFAULT_STORAGE_KEY]: saves
});
const before = storage.snapshot();

const checkpoint = createBrowserMigrationRecoveryCheckpoint(storage);
assert.strictEqual(checkpoint.verified, true);
assert.strictEqual(checkpoint.legacyValue, legacy);
assert.strictEqual(checkpoint.gameStateSaveValue, saves);
assert.strictEqual(storage.snapshot(), before);

storage.setItem(LEGACY_LOCAL_STORAGE_KEY, '{"changed":true}');
storage.setItem(DEFAULT_STORAGE_KEY, '{"changed":true}');
storage.setItem('unrelated_key', 'leave-me-alone');

const restored = restoreBrowserMigrationRecoveryCheckpoint(storage, checkpoint);
assert.strictEqual(restored.restored, true);
assert.strictEqual(restored.legacyRestored, true);
assert.strictEqual(restored.gameStateSaveStoreRestored, true);
assert.strictEqual(restored.activationPerformed, false);
assert.strictEqual(restored.sourceDeletionAllowed, false);
assert.strictEqual(storage.getItem(LEGACY_LOCAL_STORAGE_KEY), legacy);
assert.strictEqual(storage.getItem(DEFAULT_STORAGE_KEY), saves);
assert.strictEqual(storage.getItem('unrelated_key'), 'leave-me-alone');

const emptyStorage = createStorage();
const emptyCheckpoint = createBrowserMigrationRecoveryCheckpoint(emptyStorage);
assert.strictEqual(emptyCheckpoint.verified, true);
emptyStorage.setItem(LEGACY_LOCAL_STORAGE_KEY, 'temporary');
emptyStorage.setItem(DEFAULT_STORAGE_KEY, 'temporary');
restoreBrowserMigrationRecoveryCheckpoint(emptyStorage, emptyCheckpoint);
assert.strictEqual(emptyStorage.getItem(LEGACY_LOCAL_STORAGE_KEY), null);
assert.strictEqual(emptyStorage.getItem(DEFAULT_STORAGE_KEY), null);

assert.throws(
  () => restoreBrowserMigrationRecoveryCheckpoint(storage, { kind: 'browser-migration-recovery-checkpoint', version: 1, verified: false }),
  /Verified browser migration recovery checkpoint is required/
);
assert.throws(
  () => createBrowserMigrationRecoveryCheckpoint({}),
  /Web Storage-compatible storage is required/
);

console.log('Browser migration recovery checkpoint tests passed.');
