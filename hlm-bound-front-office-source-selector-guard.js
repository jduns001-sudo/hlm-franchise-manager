'use strict';

const { serializeGameState } = require('./hlm-game-state-serialization');

function createBoundFrontOfficeSourceSelectorGuard(selector, runtime, bindingVerification, binding) {
  if (!selector || selector.kind !== 'reversible-front-office-source-selector' ||
      typeof selector.selectGameState !== 'function' || typeof selector.rollbackToLegacy !== 'function') {
    throw new TypeError('Reversible Front Office source selector is required');
  }
  if (!runtime || runtime.kind !== 'isolated-gamestate-runtime' || typeof runtime.read !== 'function') {
    throw new TypeError('Isolated GameState runtime is required');
  }
  if (!bindingVerification || bindingVerification.kind !== 'front-office-cutover-candidate-binding-verification' ||
      bindingVerification.verified !== true || bindingVerification.exactStateMatch !== true) {
    throw new Error('Verified exact Front Office cutover candidate binding is required');
  }
  if (!binding || binding.kind !== 'front-office-cutover-candidate-binding' ||
      binding.bound !== true || typeof binding.canonicalState !== 'string') {
    throw new Error('Bound Front Office cutover candidate is required');
  }
  if (selector.slotId !== binding.slotId || runtime.slotId !== binding.slotId ||
      bindingVerification.slotId !== binding.slotId) {
    throw new Error('Selector, runtime, and candidate binding slots must match');
  }

  function verifyExactCandidate() {
    if (runtime.active !== true) throw new Error('GameState runtime must remain active');
    if (runtime.slotId !== binding.slotId) throw new Error('Runtime slot no longer matches bound candidate');
    const state = runtime.read();
    if (!state || serializeGameState(state) !== binding.canonicalState) {
      throw new Error('Runtime GameState no longer matches exact bound cutover candidate');
    }
  }

  return Object.freeze({
    kind: 'bound-front-office-source-selector-guard',
    version: 1,
    get source() { return selector.source; },
    get slotId() { return binding.slotId; },
    async read() { return selector.read(); },
    selectGameState() {
      if (selector.source !== 'legacy') throw new Error('Source selector must begin on legacy');
      verifyExactCandidate();
      const result = selector.selectGameState();
      verifyExactCandidate();
      return Object.freeze({
        ...result,
        exactCandidateVerified: true,
        persistenceWritePerformed: false,
        legacySourceDeletionAllowed: false,
        liveFrontOfficeWiringPerformed: false
      });
    },
    rollbackToLegacy() {
      return selector.rollbackToLegacy();
    },
    exactCandidateRequired: true,
    frontOfficeActivationAllowed: false,
    frontOfficeActivationPerformed: false,
    persistenceWriteAllowed: false,
    legacySourceDeletionAllowed: false,
    liveFrontOfficeWiringPerformed: false
  });
}

module.exports = { createBoundFrontOfficeSourceSelectorGuard };
