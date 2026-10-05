'use strict';
const assert = require('assert');
const { createReversibleFrontOfficeSourceSelector } = require('./hlm-reversible-front-office-source-selector');
const { verifyFrontOfficeSourceSelectorTransaction } = require('./hlm-front-office-source-selector-transaction-verification');

function legacyAdapter(state) {
  return Object.freeze({
    kind: 'front-office-read-only-runtime-adapter',
    version: 1,
    async readLegacySnapshot() { return JSON.parse(JSON.stringify(state)); }
  });
}

function runtime(state, slotId) {
  return Object.freeze({
    kind: 'isolated-gamestate-runtime',
    version: 1,
    active: true,
    slotId,
    read() { return JSON.parse(JSON.stringify(state)); }
  });
}

const contract = Object.freeze({
  kind: 'front-office-gamestate-cutover-transaction-contract',
  version: 1,
  ready: true,
  slotId: 'mission76',
  sourceSelectorRequired: true,
  activationMustBeReversible: true
});

(async () => {
  const legacy = { players: [{ id: 'legacy' }], settings: { controlledTeamId: 'PIT' } };
  const gameState = { schemaVersion: 1, meta: { source: 'mission76' }, universe: { players: [{ id: 'central' }] } };

  const selector = createReversibleFrontOfficeSourceSelector(legacyAdapter(legacy), runtime(gameState, 'mission76'), contract);
  const verified = await verifyFrontOfficeSourceSelectorTransaction(selector, legacy, gameState);

  assert.strictEqual(verified.verified, true);
  assert.strictEqual(verified.gameStateSelected, true);
  assert.strictEqual(verified.gameStateMatched, true);
  assert.strictEqual(verified.rollbackPerformed, true);
  assert.strictEqual(verified.legacyRestored, true);
  assert.strictEqual(verified.finalSource, 'legacy');
  assert.strictEqual(verified.persistenceWritePerformed, false);
  assert.strictEqual(verified.liveFrontOfficeWiringPerformed, false);
  assert.deepStrictEqual(verified.blockers, []);

  const mismatchSelector = createReversibleFrontOfficeSourceSelector(legacyAdapter(legacy), runtime(gameState, 'mission76'), contract);
  const mismatch = await verifyFrontOfficeSourceSelectorTransaction(mismatchSelector, legacy, { schemaVersion: 1, wrong: true });
  assert.strictEqual(mismatch.verified, false);
  assert.strictEqual(mismatch.rollbackPerformed, true);
  assert.strictEqual(mismatch.legacyRestored, true);
  assert.strictEqual(mismatch.finalSource, 'legacy');
  assert(mismatch.blockers.includes('Selected GameState does not match expected GameState'));

  console.log('Front Office source selector transaction verification tests passed.');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
