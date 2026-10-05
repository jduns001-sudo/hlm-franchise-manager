'use strict';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createReversibleFrontOfficeSourceSelector(legacyAdapter, gameStateRuntime, contract) {
  if (!legacyAdapter || legacyAdapter.kind !== 'front-office-read-only-runtime-adapter' ||
      typeof legacyAdapter.readLegacySnapshot !== 'function') {
    throw new TypeError('Read-only Front Office legacy adapter is required');
  }
  if (!gameStateRuntime || gameStateRuntime.kind !== 'isolated-gamestate-runtime' ||
      typeof gameStateRuntime.read !== 'function') {
    throw new TypeError('Isolated GameState runtime is required');
  }
  if (!contract || contract.kind !== 'front-office-gamestate-cutover-transaction-contract' ||
      contract.ready !== true || contract.sourceSelectorRequired !== true ||
      contract.activationMustBeReversible !== true) {
    throw new Error('Ready reversible Front Office cutover transaction contract is required');
  }

  let source = 'legacy';

  return Object.freeze({
    kind: 'reversible-front-office-source-selector',
    version: 1,
    get source() { return source; },
    get slotId() { return contract.slotId; },
    get gameStateSelected() { return source === 'gamestate'; },
    async read() {
      if (source === 'legacy') return legacyAdapter.readLegacySnapshot();
      const state = gameStateRuntime.read();
      if (!state) throw new Error('Selected GameState runtime has no active state');
      return clone(state);
    },
    selectGameState() {
      if (source !== 'legacy') throw new Error('GameState source is already selected');
      if (gameStateRuntime.active !== true) throw new Error('GameState runtime must be active before selection');
      if (gameStateRuntime.slotId !== contract.slotId) throw new Error('GameState runtime slot does not match cutover contract');
      source = 'gamestate';
      return Object.freeze({
        selected: true,
        source,
        slotId: contract.slotId,
        persistenceWritePerformed: false,
        legacySourceDeletionAllowed: false,
        liveFrontOfficeWiringPerformed: false
      });
    },
    rollbackToLegacy() {
      source = 'legacy';
      return Object.freeze({
        rolledBack: true,
        source,
        slotId: contract.slotId,
        persistenceWritePerformed: false,
        legacySourceDeletionAllowed: false,
        liveFrontOfficeWiringPerformed: false
      });
    }
  });
}

module.exports = { createReversibleFrontOfficeSourceSelector };
