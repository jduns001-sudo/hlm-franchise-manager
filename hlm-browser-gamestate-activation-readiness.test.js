'use strict';
const assert = require('assert');
const { createSchema7BrowserMigrationSession } = require('./hlm-schema7-browser-migration-session');
const { BROWSER_MIGRATION_AUTHORIZATION_PHRASE } = require('./hlm-schema7-browser-migration-authorization');
const { LEGACY_LOCAL_STORAGE_KEY } = require('./hlm-schema7-browser-gamestate-bridge');
const { evaluateBrowserGameStateActivationReadiness } = require('./hlm-browser-gamestate-activation-readiness');

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
  const storage = memoryStorage({ [LEGACY_LOCAL_STORAGE_KEY]: JSON.stringify(source) });
  const session = createSchema7BrowserMigrationSession(storage, 'mission67-test');

  session.authorize(source, BROWSER_MIGRATION_AUTHORIZATION_PHRASE);
  const migration = await session.execute(source);
  const beforeReadiness = storage.snapshot();

  const readiness = evaluateBrowserGameStateActivationReadiness(storage, 'mission67-test', migration);
  assert.strictEqual(readiness.ready, true);
  assert.strictEqual(readiness.gameStateVerified, true);
  assert.strictEqual(readiness.checkpointVerified, true);
  assert.strictEqual(readiness.activationAuthorized, false);
  assert.strictEqual(readiness.activationPerformed, false);
  assert.strictEqual(readiness.legacySourceDeletionAllowed, false);
  assert.strictEqual(readiness.state.schemaVersion, 1);
  assert.deepStrictEqual(readiness.blockers, []);
  assert.strictEqual(storage.snapshot(), beforeReadiness);

  const missingMigration = evaluateBrowserGameStateActivationReadiness(storage, 'mission67-test', null);
  assert.strictEqual(missingMigration.ready, false);
  assert(missingMigration.blockers.includes('Verified browser migration session result is required'));

  const unverified = evaluateBrowserGameStateActivationReadiness(storage, 'mission67-test', {
    kind: 'schema7-browser-migration-session-result',
    executed: true,
    persisted: true,
    verified: false,
    checkpointCreated: true,
    checkpoint: { verified: true },
    activationPerformed: false
  });
  assert.strictEqual(unverified.ready, false);
  assert(unverified.blockers.includes('Persisted GameState was not verified'));

  const noCheckpoint = evaluateBrowserGameStateActivationReadiness(storage, 'mission67-test', {
    kind: 'schema7-browser-migration-session-result',
    executed: true,
    persisted: true,
    verified: true,
    checkpointCreated: false,
    checkpoint: null,
    activationPerformed: false
  });
  assert.strictEqual(noCheckpoint.ready, false);
  assert(noCheckpoint.blockers.includes('Verified recovery checkpoint is required'));

  const wrongSlot = evaluateBrowserGameStateActivationReadiness(storage, 'missing-slot', migration);
  assert.strictEqual(wrongSlot.ready, false);
  assert(wrongSlot.blockers.includes('Save slot not found'));

  assert.strictEqual(storage.snapshot(), beforeReadiness);
  console.log('Browser GameState activation readiness tests passed.');
})().catch(error => { console.error(error); process.exit(1); });
