'use strict';

/**
 * Phase 3 Mission 119: calendar replacement cleanup transaction completion.
 * Finalizes one exact independently verified Mission 118 cleanup chain.
 * Performs no persistence writes, deletion, or calendar advancement.
 */

function completionError(message) {
  const error = new Error(message);
  error.code = 'CALENDAR_REPLACEMENT_CLEANUP_TRANSACTION_NOT_COMPLETE';
  return error;
}

function completeCalendarReplacementCleanupTransaction(input = {}) {
  const verification = input.verification;

  if (
    !verification ||
    verification.kind !== 'calendar-replacement-cleanup-verification' ||
    verification.version !== 1 ||
    verification.verified !== true ||
    verification.stagingSlotAbsent !== true ||
    verification.targetMatchesAuthorizedCandidate !== true ||
    verification.checkpointPreserved !== true ||
    verification.lineageIntact !== true ||
    !verification.execution ||
    !verification.readiness ||
    !verification.authorization ||
    !verification.completion ||
    !verification.checkpoint ||
    !verification.state
  ) {
    throw completionError('A verified calendar replacement cleanup is required.');
  }

  const execution = verification.execution;
  const readiness = verification.readiness;
  const authorization = verification.authorization;
  const replacementCompletion = verification.completion;

  if (
    execution.kind !== 'calendar-replacement-cleanup-execution' ||
    execution.version !== 1 ||
    execution.executed !== true ||
    execution.verified !== true ||
    execution.stagingSlotRemoved !== true ||
    execution.checkpointPreserved !== true ||
    execution.readiness !== readiness ||
    execution.authorization !== authorization ||
    execution.completion !== replacementCompletion ||
    execution.checkpoint !== verification.checkpoint ||
    authorization.kind !== 'calendar-replacement-cleanup-authorization' ||
    authorization.version !== 1 ||
    authorization.approved !== true ||
    authorization.readiness !== readiness ||
    authorization.completion !== replacementCompletion ||
    authorization.checkpoint !== verification.checkpoint ||
    readiness.kind !== 'calendar-replacement-cleanup-readiness' ||
    readiness.version !== 1 ||
    readiness.ready !== true ||
    readiness.completion !== replacementCompletion ||
    readiness.checkpoint !== verification.checkpoint ||
    replacementCompletion.kind !== 'calendar-replacement-transaction-completion' ||
    replacementCompletion.complete !== true ||
    verification.candidateSlotId !== execution.candidateSlotId ||
    verification.targetSlotId !== execution.targetSlotId ||
    verification.storageKey !== execution.storageKey ||
    verification.fromDate !== execution.fromDate ||
    verification.toDate !== execution.toDate ||
    verification.state.meta?.currentDate !== verification.toDate
  ) {
    throw completionError('Cleanup verification lineage is inconsistent.');
  }

  return Object.freeze({
    kind: 'calendar-replacement-cleanup-transaction-completion',
    version: 1,
    complete: true,
    cleanupPerformed: true,
    cleanupVerified: true,
    stagingSlotRemoved: true,
    targetPreserved: true,
    checkpointPreserved: true,
    lineageIntact: true,
    candidateSlotId: verification.candidateSlotId,
    targetSlotId: verification.targetSlotId,
    storageKey: verification.storageKey,
    fromDate: verification.fromDate,
    toDate: verification.toDate,
    verification,
    execution,
    readiness,
    authorization,
    replacementCompletion,
    checkpoint: verification.checkpoint,
    state: verification.state
  });
}

module.exports = { completeCalendarReplacementCleanupTransaction };
