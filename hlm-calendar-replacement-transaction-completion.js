'use strict';

/**
 * Phase 3 Mission 114: calendar replacement transaction completion gate.
 * Finalizes one exact independently verified Mission 113 replacement chain.
 * Performs no persistence writes or cleanup.
 */

function completionError(message) {
  const error = new Error(message);
  error.code = 'CALENDAR_REPLACEMENT_TRANSACTION_NOT_COMPLETE';
  return error;
}

function completeCalendarReplacementTransaction(input = {}) {
  const verification = input.verification;
  if (
    !verification ||
    verification.kind !== 'existing-slot-calendar-replacement-verification' ||
    verification.version !== 1 ||
    verification.verified !== true ||
    !verification.execution ||
    !verification.authorization ||
    !verification.checkpoint ||
    !verification.state
  ) {
    throw completionError('A verified existing-slot calendar replacement is required.');
  }

  const execution = verification.execution;
  const authorization = verification.authorization;
  if (
    execution.kind !== 'existing-slot-calendar-replacement-execution' ||
    execution.version !== 1 ||
    execution.executed !== true ||
    execution.verified !== true ||
    execution.rolledBack !== false ||
    execution.authorization !== authorization ||
    execution.checkpoint !== verification.checkpoint ||
    authorization.approved !== true ||
    authorization.candidateState !== execution.candidateState ||
    verification.candidateSlotId !== execution.candidateSlotId ||
    verification.targetSlotId !== execution.targetSlotId ||
    verification.storageKey !== execution.storageKey ||
    verification.fromDate !== execution.fromDate ||
    verification.toDate !== execution.toDate ||
    verification.state.meta?.currentDate !== verification.toDate
  ) {
    throw completionError('Replacement verification lineage is inconsistent.');
  }

  return Object.freeze({
    kind: 'calendar-replacement-transaction-completion',
    version: 1,
    complete: true,
    durableVerificationComplete: true,
    cleanupPerformed: false,
    checkpointPreserved: true,
    stagingSlotPreserved: true,
    candidateSlotId: verification.candidateSlotId,
    targetSlotId: verification.targetSlotId,
    storageKey: verification.storageKey,
    fromDate: verification.fromDate,
    toDate: verification.toDate,
    verification,
    execution,
    authorization,
    checkpoint: verification.checkpoint,
    state: verification.state
  });
}

module.exports = { completeCalendarReplacementTransaction };
