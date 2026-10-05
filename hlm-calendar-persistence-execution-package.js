'use strict';

/**
 * Phase 3 Mission 104: calendar persistence execution package.
 * Packages an exact authorized candidate for later execution. Performs no writes.
 */

const { validateGameStateEnvelope } = require('./hlm-game-state');
const { assertCalendarPersistenceAuthorized } = require('./hlm-calendar-persistence-authorization');

function packageError(message) {
  const error = new Error(message);
  error.code = 'INVALID_CALENDAR_PERSISTENCE_EXECUTION_PACKAGE';
  return error;
}

function createCalendarPersistenceExecutionPackage(input = {}) {
  const readiness = input.readiness;
  const authorization = input.authorization;

  try {
    assertCalendarPersistenceAuthorized(readiness, authorization);
  } catch (_) {
    throw packageError('Exact calendar persistence authorization is required.');
  }

  const candidateState = readiness.candidateState;
  if (
    !validateGameStateEnvelope(candidateState).valid ||
    candidateState !== authorization.candidateState ||
    candidateState.meta.currentDate !== readiness.toDate
  ) {
    throw packageError('Authorized calendar candidate GameState is invalid.');
  }

  return Object.freeze({
    kind: 'calendar-persistence-execution-package',
    version: 1,
    executable: false,
    packaged: true,
    fromDate: readiness.fromDate,
    toDate: readiness.toDate,
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

module.exports = { createCalendarPersistenceExecutionPackage };
