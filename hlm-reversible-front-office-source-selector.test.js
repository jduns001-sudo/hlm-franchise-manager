'use strict';
const assert = require('assert');
const { createReversibleFrontOfficeSourceSelector } = require('./hlm-reversible-front-office-source-selector');

function legacyAdapter(state) {
  return Object.freeze({
    kind: 'front-office-read-only-runtime-adapter',
    version: 1,
    async readLegacySnapshot() { return JSON.parse(JSON.stringify(state)); }
  });
}

function gameStateRuntime(state, slotId, active = true) {
  return Object.freeze({
    kind: 'isolated-gamestate-runtime',
    version: 1,
    active,
    slotId: active ? slotId : null,
    read() { return active ? JSON.parse(JSON.stringify(state)) : null; }
  });
}

const contract = Object.freeze({
  kind: 'front-office-gamestate-cutover-transaction-contract',
  version: 1,
  ready: true,
  slotId: 'mission75',
  sourceSelectorRequired: true,
  activationMustBeReversible: true
});

(async () => {
  const legacy = { players: [{ id: 'legacy-player' }] };
  const gameState = { meta: { schemaVersion: 1 }, universe: { players: [{ id: 'gamestate-player' }] } };
  const selector = createReversibleFrontOfficeSourceSelector(
    legacyAdapter(legacy),
    gameStateRuntime(gameState, 'mission75'),
    contract
  );

  assert.strictEqual(selector.source, 'legacy');
  assert.deepStrictEqual(await selector.read(), legacy);

  const selected = selector.selectGameState();
  assert.strictEqual(selected.selected, true);
  assert.strictEqual(selected.source, 'gamestate');
  assert.strictEqual(selected.liveFrontOfficeWiringPerformed, false);
  assert.strictEqual(selector.source, 'gamestate');
  assert.deepStrictEqual(await selector.read(), gameState);

  const rollback = selector.rollbackToLegacy();
  assert.strictEqual(rollback.rolledBack, true);
  assert.strictEqual(rollback.source, 'legacy');
  assert.strictEqual(rollback.liveFrontOfficeWiringPerformed, false);
  assert.deepStrictEqual(await selector.read(), legacy);

  assert.throws(
    () => createReversibleFrontOfficeSourceSelector(legacyAdapter(legacy), gameStateRuntime(gameState, 'mission75'), null),
    /Ready reversible Front Office cutover transaction contract is required/
  );

  const inactive = createReversibleFrontOfficeSourceSelector(
    legacyAdapter(legacy),
    gameStateRuntime(gameState, 'mission75', false),
    contract
  );
  assert.throws(() => inactive.selectGameState(), /GameState runtime must be active before selection/);

  const wrongSlot = createReversibleFrontOfficeSourceSelector(
    legacyAdapter(legacy),
    gameStateRuntime(gameState, 'other-slot'),
    contract
  );
  assert.throws(() => wrongSlot.selectGameState(), /slot does not match cutover contract/);

  console.log('Reversible Front Office source selector tests passed.');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
