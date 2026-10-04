'use strict';
const assert = require('assert');
const { DEFAULT_STORAGE_KEY } = require('./hlm-browser-save-adapter');
const { LEGACY_LOCAL_STORAGE_KEY } = require('./hlm-schema7-browser-gamestate-bridge');
const { BROWSER_MIGRATION_AUTHORIZATION_PHRASE } = require('./hlm-schema7-browser-migration-authorization');
const { evaluateSchema7BrowserPersistencePreflight } = require('./hlm-schema7-browser-persistence-preflight');

function createStorage(seed = {}) {
  const data = { ...seed };
  return {
    getItem(key) { return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null; },
    setItem(key, value) { data[key] = String(value); },
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

const storage = createStorage({ [LEGACY_LOCAL_STORAGE_KEY]: JSON.stringify(source) });
const sourceBefore = JSON.stringify(source);
const storageBefore = storage.snapshot();

const ready = evaluateSchema7BrowserPersistencePreflight(
  storage,
  'migration-slot',
  source,
  BROWSER_MIGRATION_AUTHORIZATION_PHRASE
);
assert.strictEqual(ready.ready, true);
assert.strictEqual(ready.authorized, true);
assert.strictEqual(ready.authorizationPhraseAccepted, true);
assert.strictEqual(ready.targetSlotOccupied, false);
assert.strictEqual(ready.persistenceEnabled, false);
assert.strictEqual(ready.writePerformed, false);
assert.strictEqual(ready.sourceMutationAllowed, false);
assert.strictEqual(ready.sourceDeletionAllowed, false);
assert.strictEqual(JSON.stringify(source), sourceBefore);
assert.strictEqual(storage.snapshot(), storageBefore);

const denied = evaluateSchema7BrowserPersistencePreflight(storage, 'migration-slot', source, 'wrong');
assert.strictEqual(denied.ready, false);
assert.strictEqual(denied.authorized, false);
assert.strictEqual(denied.persistenceEnabled, false);

const invalidStorage = evaluateSchema7BrowserPersistencePreflight({}, 'migration-slot', source, BROWSER_MIGRATION_AUTHORIZATION_PHRASE);
assert.strictEqual(invalidStorage.ready, false);
assert(invalidStorage.blockers.includes('Web Storage-compatible storage is required'));

const invalidSlot = evaluateSchema7BrowserPersistencePreflight(storage, '   ', source, BROWSER_MIGRATION_AUTHORIZATION_PHRASE);
assert.strictEqual(invalidSlot.ready, false);
assert(invalidSlot.blockers.includes('Save slot ID is required'));

const occupiedStorage = createStorage({
  [LEGACY_LOCAL_STORAGE_KEY]: JSON.stringify(source),
  [DEFAULT_STORAGE_KEY]: JSON.stringify({ existing: '{}' })
});
const occupiedBefore = occupiedStorage.snapshot();
const occupied = evaluateSchema7BrowserPersistencePreflight(
  occupiedStorage,
  'existing',
  source,
  BROWSER_MIGRATION_AUTHORIZATION_PHRASE
);
assert.strictEqual(occupied.ready, false);
assert.strictEqual(occupied.targetSlotOccupied, true);
assert(occupied.blockers.includes('Target save slot already exists'));
assert.strictEqual(occupiedStorage.snapshot(), occupiedBefore);

const repeated = evaluateSchema7BrowserPersistencePreflight(
  storage,
  'migration-slot',
  source,
  BROWSER_MIGRATION_AUTHORIZATION_PHRASE
);
assert.deepStrictEqual(repeated, ready);
assert.strictEqual(storage.snapshot(), storageBefore);

console.log('Schema 7 browser persistence preflight tests passed.');
