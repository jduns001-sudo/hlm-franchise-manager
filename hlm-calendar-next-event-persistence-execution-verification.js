'use strict';

/**
 * Phase 3 Mission 139: next-event persistence execution verification.
 * Independently verifies Mission 138 execution lineage. Performs no writes.
 */

const { assertNextEventCalendarPersistenceExecutionAuthorized } = require('./hlm-calendar-next-event-persistence-execution-authorization');

function verificationError(message) {
  const error = new Error(message);
  error.code = 'NEXT_EVENT_CALENDAR_PERSISTENCE_EXECUTION_VERIFICATION_FAILED';
  return error;
}

function verifyNextEventCalendarPersistenceExecution(input = {}) {
  const execution = input.execution;
  if (
    !execution ||
    execution.kind !== 'isolated-next-event-calendar-persistence-execution' ||
    execution.version !== 1 ||
    execution.executed !== true ||
    execution.verified !== true ||
    execution.rolledBack !== false ||
    typeof execution.slotId !== 'string' ||
    !execution.slotId.trim() ||
    !execution.targetEvent ||
    !execution.package ||
    !execution.authorization
  ) {
    throw verificationError('A successful Mission 138 isolated next-event persistence execution is required.');
  }

  try {
    assertNextEventCalendarPersistenceExecutionAuthorized(execution.package, execution.authorization);
  } catch (_) {
    throw verificationError('Execution authorization does not match its exact next-event persistence package.');
  }

  if (
    execution.authorization.package !== execution.package ||
    execution.targetEvent !== execution.package.targetEvent ||
    execution.targetEvent !== execution.authorization.targetEvent ||
    execution.targetEvent.date !== execution.toDate ||
    execution.package.candidateState !== execution.authorization.candidateState ||
    execution.fromDate !== execution.package.fromDate ||
    execution.toDate !== execution.package.toDate ||
    execution.package.candidateState.meta?.currentDate !== execution.toDate
  ) {
    throw verificationError('Next-event persistence execution lineage, target event, or dates do not match.');
  }

  return Object.freeze({
    kind: 'next-event-calendar-persistence-execution-verification',
    version: 1,
    verified: true,
    slotId: execution.slotId,
    fromDate: execution.fromDate,
    toDate: execution.toDate,
    targetEvent: execution.targetEvent,
    execution
  });
}

module.exports = { verifyNextEventCalendarPersistenceExecution };
