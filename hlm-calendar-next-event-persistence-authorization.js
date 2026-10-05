'use strict';

/**
 * Phase 3 Mission 135: next-event calendar persistence authorization.
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
    readiness.kind !== 'next-event-calendar-persistence-readiness' ||
    readiness.version !== 1 ||
    readiness.ready !== true ||
    typeof readiness.fromDate !== 'string' ||
    typeof readiness.toDate !== 'string' ||
    !readiness.targetEvent ||
    readiness.targetEvent.date !== readiness.toDate ||
    !readiness.verification ||
    readiness.targetEvent !== readiness.verification.targetEvent ||
    !readiness.candidateState ||
    readiness.candidateState !== readiness.verification.activation?.state ||
    readiness.candidateState.meta?.currentDate !== readiness.toDate ||
    readiness.requirements?.explicitPersistenceAuthorizationRequired !== true ||
    readiness.requirements?.verifyAfterWriteRequired !== true ||
    readiness.requirements?.rollbackOnFailureRequired !== true
  ) {
    throw authorizationError(
      'INVALID_NEXT_EVENT_CALENDAR_PERSISTENCE_AUTHORIZATION',
      'A valid exact Mission 134 next-event persistence readiness result is required.'
    );
  }
  return readiness;
}

function createNextEventCalendarPersistenceAuthorization(input = {}) {
  const readiness = assertReadiness(input.readiness);
  if (input.approved !== true) {
    throw authorizationError(
      'NEXT_EVENT_CALENDAR_PERSISTENCE_NOT_APPROVED',
      'Next-event calendar persistence requires explicit approval.'
    );
  }

  return Object.freeze({
    kind: 'next-event-calendar-persistence-authorization',
    version: 1,
    approved: true,
    fromDate: readiness.fromDate,
    toDate: readiness.toDate,
    targetEvent: readiness.targetEvent,
    readiness,
    candidateState: readiness.candidateState
  });
}

function assertNextEventCalendarPersistenceAuthorized(readiness, authorization) {
  const validatedReadiness = assertReadiness(readiness);
  if (
    !authorization ||
    authorization.kind !== 'next-event-calendar-persistence-authorization' ||
    authorization.version !== 1 ||
    authorization.approved !== true ||
    authorization.readiness !== validatedReadiness ||
    authorization.targetEvent !== validatedReadiness.targetEvent ||
    authorization.candidateState !== validatedReadiness.candidateState ||
    authorization.fromDate !== validatedReadiness.fromDate ||
    authorization.toDate !== validatedReadiness.toDate
  ) {
    throw authorizationError(
      'NEXT_EVENT_CALENDAR_PERSISTENCE_AUTHORIZATION_MISMATCH',
      'Persistence authorization does not match the exact next-event readiness result.'
    );
  }
  return true;
}

module.exports = {
  createNextEventCalendarPersistenceAuthorization,
  assertNextEventCalendarPersistenceAuthorized
};
