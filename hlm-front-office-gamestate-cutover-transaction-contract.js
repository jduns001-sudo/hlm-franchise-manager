'use strict';

function createFrontOfficeCutoverTransactionContract(preflight) {
  const blockers = [];

  if (!preflight || preflight.kind !== 'front-office-gamestate-cutover-preflight') {
    blockers.push('Front Office GameState cutover preflight is required');
  } else {
    if (preflight.ready !== true) blockers.push(...preflight.blockers);
    if (preflight.transactionReady !== true) blockers.push('Cutover transaction readiness is required');
    if (preflight.sourceAuthorized !== true) blockers.push('GameState source authorization is required');
    if (preflight.recoveryCheckpointVerified !== true) blockers.push('Verified recovery checkpoint is required');
    if (preflight.rollbackRequiredOnFailure !== true) blockers.push('Rollback-on-failure guarantee is required');
    if (preflight.frontOfficeActivationPerformed !== false) blockers.push('Front Office must not already be activated');
    if (!preflight.slotId) blockers.push('Authorized GameState slot ID is required');
  }

  const ready = blockers.length === 0;

  return Object.freeze({
    kind: 'front-office-gamestate-cutover-transaction-contract',
    version: 1,
    ready,
    slotId: preflight && preflight.slotId || null,
    sourceAuthorized: Boolean(preflight && preflight.sourceAuthorized),
    recoveryCheckpointVerified: Boolean(preflight && preflight.recoveryCheckpointVerified),
    rollbackRequiredOnFailure: true,
    activationMustBeAtomic: true,
    activationMustBeReversible: true,
    postActivationVerificationRequired: true,
    legacyRuntimeMustRemainRecoverable: true,
    sourceSelectorRequired: true,
    frontOfficeActivationAllowed: false,
    frontOfficeActivationPerformed: false,
    persistenceWriteAllowed: false,
    legacySourceDeletionAllowed: false,
    blockers: Object.freeze(blockers)
  });
}

module.exports = { createFrontOfficeCutoverTransactionContract };
