'use strict';

const { serializeGameState } = require('./hlm-game-state-serialization');

function bindFrontOfficeCutoverCandidate(contract, activationVerification, compatibilityVerification, candidateState) {
  const blockers = [];

  if (!contract || contract.kind !== 'front-office-gamestate-cutover-transaction-contract' || contract.ready !== true) {
    blockers.push('Ready Front Office cutover transaction contract is required');
  }
  if (!activationVerification || activationVerification.kind !== 'isolated-gamestate-activation-verification' ||
      activationVerification.verified !== true || activationVerification.stateMatches !== true) {
    blockers.push('Verified isolated GameState activation is required');
  }
  if (!compatibilityVerification || compatibilityVerification.kind !== 'front-office-projection-compatibility-verification' ||
      compatibilityVerification.compatible !== true) {
    blockers.push('Compatible Front Office projection verification is required');
  }

  const contractSlotId = contract && contract.slotId || null;
  const verifiedSlotId = activationVerification && activationVerification.slotId || null;
  if (!contractSlotId || contractSlotId !== verifiedSlotId) {
    blockers.push('Cutover contract slot does not match verified activation slot');
  }

  let canonicalState = null;
  if (!blockers.length) {
    try {
      canonicalState = serializeGameState(candidateState);
    } catch (error) {
      blockers.push(error && error.message ? error.message : 'Candidate GameState serialization failed');
    }
  }

  return Object.freeze({
    kind: 'front-office-cutover-candidate-binding',
    version: 1,
    bound: blockers.length === 0,
    slotId: contractSlotId,
    canonicalState,
    compatibilityVerified: Boolean(compatibilityVerification && compatibilityVerification.compatible),
    activationVerified: Boolean(activationVerification && activationVerification.verified),
    exactCandidateRequired: true,
    frontOfficeActivationAllowed: false,
    frontOfficeActivationPerformed: false,
    persistenceWriteAllowed: false,
    legacySourceDeletionAllowed: false,
    liveFrontOfficeWiringPerformed: false,
    blockers: Object.freeze(blockers)
  });
}

function verifyBoundFrontOfficeCutoverCandidate(binding, runtime) {
  const blockers = [];

  if (!binding || binding.kind !== 'front-office-cutover-candidate-binding' || binding.bound !== true ||
      typeof binding.canonicalState !== 'string') {
    blockers.push('Bound Front Office cutover candidate is required');
  }
  if (!runtime || runtime.kind !== 'isolated-gamestate-runtime' || typeof runtime.read !== 'function') {
    blockers.push('Isolated GameState runtime is required');
  }

  let exactStateMatch = false;
  if (!blockers.length) {
    if (runtime.active !== true) blockers.push('GameState runtime must be active');
    if (runtime.slotId !== binding.slotId) blockers.push('Runtime slot does not match bound candidate slot');

    try {
      const runtimeState = runtime.read();
      exactStateMatch = serializeGameState(runtimeState) === binding.canonicalState;
      if (!exactStateMatch) blockers.push('Runtime GameState does not match exact bound cutover candidate');
    } catch (error) {
      blockers.push(error && error.message ? error.message : 'Bound candidate verification failed');
    }
  }

  return Object.freeze({
    kind: 'front-office-cutover-candidate-binding-verification',
    version: 1,
    verified: blockers.length === 0,
    slotId: binding && binding.slotId || null,
    exactStateMatch,
    frontOfficeActivationAllowed: false,
    frontOfficeActivationPerformed: false,
    persistenceWritePerformed: false,
    legacySourceDeletionAllowed: false,
    liveFrontOfficeWiringPerformed: false,
    blockers: Object.freeze(blockers)
  });
}

module.exports = {
  bindFrontOfficeCutoverCandidate,
  verifyBoundFrontOfficeCutoverCandidate
};
