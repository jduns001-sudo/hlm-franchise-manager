'use strict';

/**
 * Phase 3 Mission 103: calendar persistence authorization.
 * Explicit permission only. Performs no persistence writes.
 */

function authorizationError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function assertReadiness(readiness) {
  if (
    !readiness ||
    readiness.kind !== 'calendar-persistence-readiness' ||
    readiness.version !== 1 ||
    readiness.ready !== true ||
    typeof readiness.fromDate !== 'string' ||
    typeof readiness.toDate !== 'string' ||
    !readiness.verification ||
    !readiness.candidateState ||
    readiness.candidateState !== readiness.verification.activation?.state ||
    readiness.candidateState.meta?.currentDate !== readiness.toDate ||
    readiness.requirements?.explicitPersistenceAuthorizationRequired !== true ||
    readiness.requirements?.verifyAfterWriteRequired !== true ||
    readiness.requirements?.rollbackOnFailureRequired !== true
  ) {
    throw authorizationError(
      'INVALID_CALENDAR_PERSISTENCE_AUTHORIZATION',
      'A valid calendar persistence readiness result is required.'
    );
  }
  return readiness;
}

function createCalendarPersistenceAuthorization(input = {}) {
  const readiness = assertReadiness(input.readiness);
  if (input.approved !== true) {
    throw authorizationError(
      'CALENDAR_PERSISTENCE_NOT_APPROVED',
      'Calendar persistence requires explicit approval.'
    );
  }

  return Object.freeze({
    kind: 'calendar-persistence-authorization',
    version: 1,
    approved: true,
    fromDate: readiness.fromDate,
    toDate: readiness.toDate,
    readiness,
    candidateState: readiness.candidateState
  });
}

function assertCalendarPersistenceAuthorized(readiness, authorization) {
  const validatedReadiness = assertReadiness(readiness);
  if (
    !authorization ||
    authorization.kind !== 'calendar-persistence-authorization' ||
    authorization.version !== 1 ||
    authorization.approved !== true ||
    authorization.readiness !== validatedReadiness ||
    authorization.candidateState !== validatedReadiness.candidateState ||
    authorization.fromDate !== validatedReadiness.fromDate ||
    authorization.toDate !== validatedReadiness.toDate
  ) {
    throw authorizationError(
      'CALENDAR_PERSISTENCE_AUTHORIZATION_MISMATCH',
      'Persistence authorization does not match the exact readiness result.'
    );
  }
  return true;
}

module.exports = {
  createCalendarPersistenceAuthorization,
  assertCalendarPersistenceAuthorized
};
