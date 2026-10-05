'use strict';
const assert = require('assert');
const { createFrontOfficeSourceAccessBoundary } = require('./hlm-front-office-source-access-boundary');

function legacyAdapter(state) {
  return Object.freeze({
    kind: 'front-office-read-only-runtime-adapter',
    version: 1,
    async readLegacySnapshot() { return JSON.parse(JSON.stringify(state)); }
  });
}

function selector(state, source = 'legacy') {
  return Object.freeze({
    kind: 'reversible-front-office-source-selector',
    version: 1,
    source,
    async read() { return JSON.parse(JSON.stringify(state)); }
  });
}

(async () => {
  const legacy = { players: [{ id: 'legacy-player' }] };

  const defaultBoundary = createFrontOfficeSourceAccessBoundary({
    legacyAdapter: legacyAdapter(legacy)
  });
  assert.strictEqual(defaultBoundary.source, 'legacy');
  assert.strictEqual(defaultBoundary.selectorAttached, false);
  assert.deepStrictEqual(await defaultBoundary.read(), legacy);
  assert.strictEqual(defaultBoundary.frontOfficeActivationAllowed, false);
  assert.strictEqual(defaultBoundary.automaticGameStateSelectionAllowed, false);
  assert.strictEqual(defaultBoundary.persistenceWriteAllowed, false);
  assert.strictEqual(defaultBoundary.legacySourceDeletionAllowed, false);
  assert.strictEqual(defaultBoundary.liveFrontOfficeWiringPerformed, false);

  const selectedState = { schemaVersion: 1, meta: { source: 'selector' } };
  const selectorBoundary = createFrontOfficeSourceAccessBoundary({
    legacyAdapter: legacyAdapter(legacy),
    selector: selector(selectedState, 'gamestate')
  });
  assert.strictEqual(selectorBoundary.source, 'gamestate');
  assert.strictEqual(selectorBoundary.selectorAttached, true);
  assert.deepStrictEqual(await selectorBoundary.read(), selectedState);
  assert.strictEqual(selectorBoundary.automaticGameStateSelectionAllowed, false);
  assert.strictEqual(selectorBoundary.liveFrontOfficeWiringPerformed, false);

  assert.throws(
    () => createFrontOfficeSourceAccessBoundary({}),
    /Read-only Front Office legacy adapter is required/
  );

  console.log('Front Office source access boundary tests passed.');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
