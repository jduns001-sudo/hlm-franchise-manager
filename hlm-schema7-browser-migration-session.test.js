'use strict';
const assert = require('assert');
const { AUTHORIZATION_PHRASE } = require('./hlm-schema7-migration-authorization');
const { DEFAULT_STORAGE_KEY } = require('./hlm-browser-save-adapter');
const { LEGACY_LOCAL_STORAGE_KEY } = require('./hlm-schema7-browser-gamestate-bridge');
const { createSchema7BrowserMigrationSession } = require('./hlm-schema7-browser-migration-session');

function memoryStorage(initial = {}) {
  const data = { ...initial };
  return {
    getItem(k) { return Object.prototype.hasOwnProperty.call(data,k) ? data[k] : null; },
    setItem(k,v) { data[k] = String(v); },
    removeItem(k) { delete data[k]; }
  };
}

(async () => {
  const storage = memoryStorage({ [LEGACY_LOCAL_STORAGE_KEY]: 'legacy-safe' });
  const source = { schema: 7, settings: { controlledTeamId: 5 }, contracts: [], transactions: [], draftPicks: [], prospects: [], history: [], lines: { NHL: [] } };
  const session = createSchema7BrowserMigrationSession(storage, 'mission59-test');

  let result = await session.execute(source);
  assert.strictEqual(result.executed, false);
  assert.strictEqual(storage.getItem(DEFAULT_STORAGE_KEY), null);

  assert.strictEqual(session.authorize('wrong'), false);
  result = await session.execute(source);
  assert.strictEqual(result.executed, false);

  assert.strictEqual(session.authorize(AUTHORIZATION_PHRASE), true);
  result = await session.execute(source);
  assert.strictEqual(result.executed, true);
  assert.strictEqual(result.verified, true);
  assert.strictEqual(result.transformed, true);
  assert.strictEqual(result.gameStateValid, true);
  assert.strictEqual(storage.getItem(LEGACY_LOCAL_STORAGE_KEY), 'legacy-safe');

  result = await session.execute(source);
  assert.strictEqual(result.executed, false);
  console.log('Schema 7 browser migration session tests passed.');
})().catch(error => { console.error(error); process.exit(1); });
