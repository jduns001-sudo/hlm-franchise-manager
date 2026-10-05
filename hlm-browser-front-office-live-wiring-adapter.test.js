'use strict';
const assert = require('assert');
const {
  LEGACY_FRONT_OFFICE_STORAGE_KEY,
  createBrowserFrontOfficeLiveWiringAdapter
} = require('./hlm-browser-front-office-live-wiring-adapter');

function memoryStorage(seed = {}) {
  const data = { ...seed };
  return {
    getItem(key) { return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null; },
    setItem(key, value) { data[key] = String(value); },
    removeItem(key) { delete data[key]; },
    dump() { return { ...data }; }
  };
}

(async () => {
  const legacy = { players: [{ id: 'legacy-p1' }], gmSettings: { controlledTeamId: 'PIT' } };
  const storage = memoryStorage({
    [LEGACY_FRONT_OFFICE_STORAGE_KEY]: JSON.stringify(legacy),
    unrelated: 'must-survive'
  });
  const before = storage.dump();
  let source = 'legacy';
  const projected = { players: [{ id: 'gamestate-p1' }], gmSettings: { controlledTeamId: 'PIT' } };

  const boundary = {
    kind: 'front-office-live-wiring-boundary',
    get source() { return source; },
    async readFrontOfficeSnapshot() { return JSON.parse(JSON.stringify(projected)); }
  };

  const adapter = createBrowserFrontOfficeLiveWiringAdapter({ storage, liveWiringBoundary: boundary });
  assert.strictEqual(adapter.defaultSource, 'legacy');
  assert.strictEqual(adapter.source, 'legacy');
  assert.deepStrictEqual(await adapter.readSnapshot(), legacy);
  assert.deepStrictEqual(storage.dump(), before);

  source = 'gamestate';
  assert.strictEqual(adapter.source, 'gamestate');
  assert.deepStrictEqual(await adapter.readSnapshot(), projected);
  assert.deepStrictEqual(storage.dump(), before);

  assert.strictEqual(adapter.automaticGameStateSelectionAllowed, false);
  assert.strictEqual(adapter.browserStartupCutoverAllowed, false);
  assert.strictEqual(adapter.frontOfficeActivationAllowed, false);
  assert.strictEqual(adapter.persistenceWriteAllowed, false);
  assert.strictEqual(adapter.legacySourceDeletionAllowed, false);
  assert.strictEqual(adapter.liveFrontOfficeWiringPerformed, false);

  const badStorage = memoryStorage({ [LEGACY_FRONT_OFFICE_STORAGE_KEY]: '{bad-json' });
  const badAdapter = createBrowserFrontOfficeLiveWiringAdapter({
    storage: badStorage,
    liveWiringBoundary: boundary
  });
  await assert.rejects(
    () => badAdapter.readLegacySnapshot(),
    error => error && error.code === 'INVALID_LEGACY_FRONT_OFFICE_STATE'
  );

  console.log('Browser Front Office live wiring adapter tests passed.');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
