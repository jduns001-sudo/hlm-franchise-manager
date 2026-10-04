'use strict';
const assert = require('assert');
const { DEFAULT_STORAGE_KEY, createBrowserSaveAdapter } = require('./hlm-browser-save-adapter');
const { LEGACY_LOCAL_STORAGE_KEY } = require('./hlm-schema7-browser-gamestate-bridge');
const { BROWSER_MIGRATION_AUTHORIZATION_PHRASE } = require('./hlm-schema7-browser-migration-authorization');
const { executeSchema7ControlledBrowserPersistence } = require('./hlm-schema7-controlled-browser-persistence');

function createStorage(seed = {}, failOnSave = false) {
  const data = { ...seed };
  return {
    getItem(key) { return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null; },
    setItem(key, value) {
      if (failOnSave && key === DEFAULT_STORAGE_KEY) throw new Error('Simulated browser storage failure');
      data[key] = String(value);
    },
    removeItem(key) { delete data[key]; },
    snapshot() { return JSON.stringify(data); }
  };
}

const source = {
  schema: 7,
  settings: { controlledTeamId: 5 },
  contracts: [], transactions: [], draftPicks: [], prospects: [], history: [],
  lines: { NHL: [] }, depth: { NHL: [] }, draftBoard: [101], waivers: [], notes: { gm: 'keep' }
};

(async () => {
  const storage = createStorage({ [LEGACY_LOCAL_STORAGE_KEY]: JSON.stringify(source) });
  const legacyBefore = storage.getItem(LEGACY_LOCAL_STORAGE_KEY);
  const sourceBefore = JSON.stringify(source);

  const result = await executeSchema7ControlledBrowserPersistence(
    storage, 'migration-slot', source, BROWSER_MIGRATION_AUTHORIZATION_PHRASE
  );
  assert.strictEqual(result.executed, true);
  assert.strictEqual(result.persisted, true);
  assert.strictEqual(result.verified, true);
  assert.strictEqual(result.rolledBack, false);
  assert.strictEqual(result.sourcePreserved, true);
  assert.strictEqual(storage.getItem(LEGACY_LOCAL_STORAGE_KEY), legacyBefore);
  assert.strictEqual(JSON.stringify(source), sourceBefore);

  const repository = createBrowserSaveAdapter(storage, DEFAULT_STORAGE_KEY);
  const loaded = repository.load('migration-slot');
  assert.strictEqual(loaded.state.schemaVersion, 1);

  const occupiedBefore = storage.snapshot();
  const occupied = await executeSchema7ControlledBrowserPersistence(
    storage, 'migration-slot', source, BROWSER_MIGRATION_AUTHORIZATION_PHRASE
  );
  assert.strictEqual(occupied.executed, false);
  assert.strictEqual(occupied.persisted, false);
  assert.strictEqual(storage.snapshot(), occupiedBefore);

  const deniedStorage = createStorage({ [LEGACY_LOCAL_STORAGE_KEY]: JSON.stringify(source) });
  const deniedBefore = deniedStorage.snapshot();
  const denied = await executeSchema7ControlledBrowserPersistence(deniedStorage, 'denied-slot', source, 'wrong');
  assert.strictEqual(denied.executed, false);
  assert.strictEqual(denied.persisted, false);
  assert.strictEqual(deniedStorage.snapshot(), deniedBefore);

  const failingStorage = createStorage({ [LEGACY_LOCAL_STORAGE_KEY]: JSON.stringify(source) }, true);
  const failingBefore = failingStorage.snapshot();
  const failed = await executeSchema7ControlledBrowserPersistence(
    failingStorage, 'failure-slot', source, BROWSER_MIGRATION_AUTHORIZATION_PHRASE
  );
  assert.strictEqual(failed.executed, true);
  assert.strictEqual(failed.persisted, false);
  assert.strictEqual(failed.verified, false);
  assert.strictEqual(failed.rolledBack, true);
  assert.strictEqual(failingStorage.getItem(LEGACY_LOCAL_STORAGE_KEY), JSON.stringify(source));
  assert.strictEqual(failingStorage.snapshot(), failingBefore);

  console.log('Schema 7 controlled browser persistence tests passed.');
})().catch(error => {
  console.error(error);
  process.exit(1);
});
