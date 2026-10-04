'use strict';
const assert = require('assert');
const { AUTHORIZATION_PHRASE } = require('./hlm-schema7-migration-authorization');
const { createSchema7MigrationExecutionPackage } = require('./hlm-schema7-migration-execution-package');
const { DEFAULT_STORAGE_KEY } = require('./hlm-browser-save-adapter');
const { LEGACY_LOCAL_STORAGE_KEY, createSchema7BrowserIsolatedBridge } = require('./hlm-schema7-browser-isolated-bridge');

function memoryStorage(initial = {}) {
  const data = { ...initial };
  return {
    getItem(k) { return Object.prototype.hasOwnProperty.call(data,k) ? data[k] : null; },
    setItem(k,v) { data[k] = String(v); },
    removeItem(k) { delete data[k]; }
  };
}

(async () => {
  const storage = memoryStorage({ [LEGACY_LOCAL_STORAGE_KEY]: 'preserve-me' });
  const state = { schema: 7, settings: { controlledTeamId: 5 }, contracts: [], transactions: [], draftPicks: [] };
  const pkg = createSchema7MigrationExecutionPackage(state, AUTHORIZATION_PHRASE);
  const bridge = createSchema7BrowserIsolatedBridge(storage, 'migration-test');
  const result = await bridge.execute(pkg);
  assert.strictEqual(result.executed, true);
  assert.strictEqual(result.verified, true);
  assert.strictEqual(storage.getItem(LEGACY_LOCAL_STORAGE_KEY), 'preserve-me');
  assert(storage.getItem(DEFAULT_STORAGE_KEY));
  assert.strictEqual(bridge.sourceAccess, false);
  console.log('Schema 7 browser isolated bridge tests passed.');
})().catch(error => { console.error(error); process.exit(1); });
