'use strict';

/**
 * Phase 3 Mission 146: next-event replacement transaction completion.
 * Finalizes one exact independently verified Mission 145 replacement chain.
 * Performs no persistence writes or cleanup.
 */

function completionError(message) {
  const error = new Error(message);
  error.code = 'NEXT_EVENT_CALENDAR_REPLACEMENT_TRANSACTION_NOT_COMPLETE';
  return error;
}

function completeNextEventCalendarReplacementTransaction(input = {}) {
  const verification = input.verification;
  if (
    !verification ||
    verification.kind !== 'existing-slot-next-event-calendar-replacement-verification' ||
    verification.version !== 1 ||
    verification.verified !== true ||
    !verification.targetEvent ||
    verification.targetEvent.date !== verification.toDate ||
    !verification.execution ||
    !verification.authorization ||
    !verification.checkpoint ||
    !verification.state
  ) {
    throw completionError('A verified existing-slot next-event calendar replacement is required.');
  }

  const execution = verification.execution;
  const authorization = verification.authorization;
  if (
    execution.kind !== 'existing-slot-next-event-calendar-replacement-execution' ||
    execution.version !== 1 ||
    execution.executed !== true ||
    execution.verified !== true ||
    execution.rolledBack !== false ||
    execution.authorization !== authorization ||
    execution.checkpoint !== verification.checkpoint ||
    execution.targetEvent !== verification.targetEvent ||
    authorization.approved !== true ||
    authorization.targetEvent !== verification.targetEvent ||
    authorization.candidateState !== execution.candidateState ||
    verification.candidateSlotId !== execution.candidateSlotId ||
    verification.targetSlotId !== execution.targetSlotId ||
    verification.storageKey !== execution.storageKey ||
    verification.fromDate !== execution.fromDate ||
    verification.toDate !== execution.toDate ||
    verification.state.meta?.currentDate !== verification.toDate
  ) {
    throw completionError('Next-event replacement verification lineage is inconsistent.');
  }

  return Object.freeze({
    kind: 'next-event-calendar-replacement-transaction-completion',
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
    targetEvent: verification.targetEvent,
    verification,
    execution,
    authorization,
    checkpoint: verification.checkpoint,
    state: verification.state
  });
}

module.exports = { completeNextEventCalendarReplacementTransaction };
