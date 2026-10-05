'use strict';

/**
 * Phase 3 Mission 136: next-event persistence execution package.
 * Packages one exact Mission 135-authorized candidate for later execution.
 * Performs no persistence writes.
 */

const { validateGameStateEnvelope } = require('./hlm-game-state');
const { assertNextEventCalendarPersistenceAuthorized } = require('./hlm-calendar-next-event-persistence-authorization');

function packageError(message) {
  const error = new Error(message);
  error.code = 'INVALID_NEXT_EVENT_CALENDAR_PERSISTENCE_EXECUTION_PACKAGE';
  return error;
}

function createNextEventCalendarPersistenceExecutionPackage(input = {}) {
  const readiness = input.readiness;
  const authorization = input.authorization;

  try {
    assertNextEventCalendarPersistenceAuthorized(readiness, authorization);
  } catch (_) {
    throw packageError('Exact Mission 135 next-event persistence authorization is required.');
  }

  const candidateState = readiness.candidateState;
  if (
    !validateGameStateEnvelope(candidateState).valid ||
    candidateState !== authorization.candidateState ||
    readiness.targetEvent !== authorization.targetEvent ||
    readiness.targetEvent.date !== readiness.toDate ||
    candidateState.meta.currentDate !== readiness.toDate
  ) {
    throw packageError('Authorized next-event candidate GameState is invalid.');
  }

  return Object.freeze({
    kind: 'next-event-calendar-persistence-execution-package',
    version: 1,
    executable: false,
    packaged: true,
    fromDate: readiness.fromDate,
    toDate: readiness.toDate,
    targetEvent: readiness.targetEvent,
    readiness,
    authorization,
    candidateState,
    transaction: Object.freeze({
      verifyAfterWrite: true,
      rollbackOnFailure: true,
      executionAuthorizationRequired: true
    })
  });
}

module.exports = { createNextEventCalendarPersistenceExecutionPackage };
