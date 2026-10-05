'use strict';
const assert = require('assert');
const {
  BROWSER_MIGRATION_AUTHORIZATION_PHRASE
} = require('./hlm-schema7-browser-migration-authorization');
const { AUTHORIZATION_PHRASE } = require('./hlm-schema7-migration-authorization');
const { DEFAULT_STORAGE_KEY } = require('./hlm-browser-save-adapter');
const { LEGACY_LOCAL_STORAGE_KEY } = require('./hlm-schema7-browser-gamestate-bridge');
const { createSchema7BrowserMigrationSession } = require('./hlm-schema7-browser-migration-session');

function memoryStorage(initial = {}) {
  const data = { ...initial };
  return {
    getItem(k) { return Object.prototype.hasOwnProperty.call(data, k) ? data[k] : null; },
    setItem(k, v) { data[k] = String(v); },
    removeItem(k) { delete data[k]; },
    snapshot() { return JSON.stringify(data); }
  };
}

(async () => {
  const source = {
    schema: 7,
    settings: { controlledTeamId: 5 },
    contracts: [], transactions: [], draftPicks: [], prospects: [], history: [],
    lines: { NHL: [] }, depth: { NHL: [] }, draftBoard: [], waivers: [], notes: { gm: 'keep' }
  };
  const legacy = JSON.stringify(source);
  const storage = memoryStorage({ [LEGACY_LOCAL_STORAGE_KEY]: legacy });
  const session = createSchema7BrowserMigrationSession(storage, 'mission66-test');

  assert.strictEqual(session.version, 2);
  assert.strictEqual(session.activationEnabled, false);

  let result = await session.execute(source);
  assert.strictEqual(result.executed, false);
  assert.strictEqual(result.activationPerformed, false);
  assert.strictEqual(storage.getItem(DEFAULT_STORAGE_KEY), null);

  const oldAuthorization = session.authorize(source, AUTHORIZATION_PHRASE);
  assert.strictEqual(oldAuthorization.authorized, false);
  result = await session.execute(source);
  assert.strictEqual(result.executed, false);

  const authorization = session.authorize(source, BROWSER_MIGRATION_AUTHORIZATION_PHRASE);
  assert.strictEqual(authorization.authorized, true);
  const beforeExecution = storage.snapshot();

  result = await session.execute(source);
  assert.strictEqual(result.executed, true);
  assert.strictEqual(result.persisted, true);
  assert.strictEqual(result.verified, true);
  assert.strictEqual(result.checkpointCreated, true);
  assert.strictEqual(result.activationPerformed, false);
  assert.strictEqual(result.loadedState.schemaVersion, 1);
  assert.strictEqual(result.checkpoint.legacyValue, legacy);
  assert.strictEqual(result.checkpoint.gameStateSaveValue, null);
  assert.strictEqual(storage.getItem(LEGACY_LOCAL_STORAGE_KEY), legacy);
  assert.notStrictEqual(storage.snapshot(), beforeExecution);

  result = await session.execute(source);
  assert.strictEqual(result.executed, false);

  const occupiedSession = createSchema7BrowserMigrationSession(storage, 'mission66-test');
  assert.strictEqual(
    occupiedSession.authorize(source, BROWSER_MIGRATION_AUTHORIZATION_PHRASE).authorized,
    true
  );
  const occupiedBefore = storage.snapshot();
  result = await occupiedSession.execute(source);
  assert.strictEqual(result.executed, false);
  assert.strictEqual(result.persisted, false);
  assert.strictEqual(result.activationPerformed, false);
  assert.strictEqual(storage.snapshot(), occupiedBefore);

  console.log('Schema 7 browser migration session alignment tests passed.');
})().catch(error => { console.error(error); process.exit(1); });
