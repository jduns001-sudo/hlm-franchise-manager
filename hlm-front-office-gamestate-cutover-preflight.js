'use strict';

function evaluateFrontOfficeCutoverPreflight(sourceAuthorization, recoveryCheckpoint) {
  const blockers = [];

  if (!sourceAuthorization || sourceAuthorization.kind !== 'front-office-gamestate-source-authorization') {
    blockers.push('Front Office GameState source authorization is required');
  } else {
    if (sourceAuthorization.authorized !== true) blockers.push(...sourceAuthorization.blockers);
    if (sourceAuthorization.gameStateSourceOfTruthAuthorized !== true) blockers.push('GameState source-of-truth authorization is required');
    if (sourceAuthorization.frontOfficeActivationAllowed !== true) blockers.push('Front Office activation permission is required');
    if (sourceAuthorization.frontOfficeActivationPerformed !== false) blockers.push('Front Office must not already be activated');
    if (sourceAuthorization.legacyRuntimeReadOnly !== true) blockers.push('Legacy Front Office runtime must remain read-only');
    if (!sourceAuthorization.slotId) blockers.push('Authorized GameState slot ID is required');
  }

  if (!recoveryCheckpoint || recoveryCheckpoint.kind !== 'browser-migration-recovery-checkpoint' ||
      recoveryCheckpoint.version !== 1 || recoveryCheckpoint.verified !== true) {
    blockers.push('Verified browser migration recovery checkpoint is required');
  }

  return Object.freeze({
    kind: 'front-office-gamestate-cutover-preflight',
    version: 1,
    ready: blockers.length === 0,
    slotId: sourceAuthorization && sourceAuthorization.slotId || null,
    sourceAuthorized: Boolean(sourceAuthorization && sourceAuthorization.authorized),
    recoveryCheckpointVerified: Boolean(recoveryCheckpoint && recoveryCheckpoint.verified),
    transactionReady: blockers.length === 0,
    frontOfficeActivationAllowed: false,
    frontOfficeActivationPerformed: false,
    rollbackRequiredOnFailure: true,
    persistenceWriteAllowed: false,
    legacySourceDeletionAllowed: false,
    blockers: Object.freeze(blockers)
  });
}

module.exports = { evaluateFrontOfficeCutoverPreflight };
