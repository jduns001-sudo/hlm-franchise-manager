'use strict';

/**
 * Phase 3 Mission 107: calendar persistence execution verification.
 * Independently verifies a completed isolated persistence execution. Performs no writes.
 */

const { assertCalendarPersistenceExecutionAuthorized } = require('./hlm-calendar-persistence-execution-authorization');

function verificationError(message) {
  const error = new Error(message);
  error.code = 'CALENDAR_PERSISTENCE_EXECUTION_VERIFICATION_FAILED';
  return error;
}

function verifyCalendarPersistenceExecution(input = {}) {
  const execution = input.execution;
  if (
    !execution ||
    execution.kind !== 'isolated-calendar-persistence-execution' ||
    execution.version !== 1 ||
    execution.executed !== true ||
    execution.verified !== true ||
    execution.rolledBack !== false ||
    typeof execution.slotId !== 'string' ||
    !execution.slotId.trim() ||
    !execution.package ||
    !execution.authorization
  ) {
    throw verificationError('A successful isolated calendar persistence execution is required.');
  }

  try {
    assertCalendarPersistenceExecutionAuthorized(execution.package, execution.authorization);
  } catch (_) {
    throw verificationError('Execution authorization does not match its exact persistence package.');
  }

  if (
    execution.authorization.package !== execution.package ||
    execution.package.candidateState !== execution.authorization.candidateState ||
    execution.fromDate !== execution.package.fromDate ||
    execution.toDate !== execution.package.toDate ||
    execution.package.candidateState.meta?.currentDate !== execution.toDate
  ) {
    throw verificationError('Persistence execution lineage or calendar dates do not match.');
  }

  return Object.freeze({
    kind: 'calendar-persistence-execution-verification',
    version: 1,
    verified: true,
    slotId: execution.slotId,
    fromDate: execution.fromDate,
    toDate: execution.toDate,
    execution
  });
}

module.exports = { verifyCalendarPersistenceExecution };
