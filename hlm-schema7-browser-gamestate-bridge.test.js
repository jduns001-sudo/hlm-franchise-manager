'use strict';
const assert = require('assert');
const { AUTHORIZATION_PHRASE } = require('./hlm-schema7-migration-authorization');
const { DEFAULT_STORAGE_KEY } = require('./hlm-browser-save-adapter');
const { LEGACY_LOCAL_STORAGE_KEY, createSchema7BrowserGameStateBridge } = require('./hlm-schema7-browser-gamestate-bridge');

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
  const source = { schema: 7, settings: { controlledTeamId: 5 }, contracts: [], transactions: [], draftPicks: [], prospects: [], history: [], lines: { NHL: [] } };
  const bridge = createSchema7BrowserGameStateBridge(storage, 'migration-test');
  const result = await bridge.migrate(source, AUTHORIZATION_PHRASE);
  assert.strictEqual(result.executed, true);
  assert.strictEqual(result.verified, true);
  assert.strictEqual(result.transformed, true);
  assert.strictEqual(result.gameStateValid, true);
  assert.strictEqual(storage.getItem(LEGACY_LOCAL_STORAGE_KEY), 'preserve-me');
  const raw = JSON.parse(storage.getItem(DEFAULT_STORAGE_KEY));
  assert(raw['migration-test']);
  const savedEnvelope = JSON.parse(raw['migration-test']);
  assert.strictEqual(savedEnvelope.format, 'HFM_SAVE');
  assert(savedEnvelope.payload.includes('schemaVersion'));
  assert(savedEnvelope.payload.includes('frontOfficeSchema7'));
  assert.strictEqual(bridge.sourceAccess, false);
  console.log('Schema 7 browser GameState bridge tests passed.');
})().catch(error => { console.error(error); process.exit(1); });
