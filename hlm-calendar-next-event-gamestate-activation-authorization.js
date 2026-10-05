'use strict';

/**
 * Phase 3 Mission 131: next-event GameState activation authorization.
 * Explicit permission only. Binds the exact Mission 130 candidate verification.
 * No state activation, persistence, event processing, or UI wiring.
 */

function authorizationError(message) {
  const error = new Error(message);
  error.code = 'NEXT_EVENT_GAMESTATE_CALENDAR_ACTIVATION_NOT_AUTHORIZED';
  return error;
}

function assertNextEventCandidateVerification(verification) {
  if (
    !verification ||
    verification.kind !== 'next-event-gamestate-calendar-candidate-verification' ||
    verification.version !== 1 ||
    verification.verified !== true ||
    verification.dateOnlyChangeVerified !== true ||
    verification.targetEventMatched !== true ||
    typeof verification.fromDate !== 'string' ||
    typeof verification.toDate !== 'string' ||
    !verification.targetEvent ||
    verification.targetEvent.date !== verification.toDate ||
    !verification.sourceState ||
    !verification.candidate ||
    verification.candidate.kind !== 'next-event-gamestate-calendar-candidate' ||
    verification.candidate.state !== verification.state ||
    verification.candidate.targetEvent !== verification.targetEvent ||
    verification.state?.meta?.currentDate !== verification.toDate ||
    verification.sourceState?.meta?.currentDate !== verification.fromDate
  ) {
    throw authorizationError('A valid exact Mission 130 next-event candidate verification is required.');
  }
  return verification;
}

function createNextEventGameStateCalendarActivationAuthorization(input = {}) {
  const verification = assertNextEventCandidateVerification(input.verification);
  if (input.approved !== true) {
    throw authorizationError('Next-event GameState calendar activation requires explicit approval.');
  }

  return Object.freeze({
    kind: 'next-event-gamestate-calendar-activation-authorization',
    version: 1,
    approved: true,
    fromDate: verification.fromDate,
    toDate: verification.toDate,
    targetEvent: verification.targetEvent,
    verification
  });
}

function assertNextEventGameStateCalendarActivationAuthorized(verification, authorization) {
  const validated = assertNextEventCandidateVerification(verification);
  if (
    !authorization ||
    authorization.kind !== 'next-event-gamestate-calendar-activation-authorization' ||
    authorization.version !== 1 ||
    authorization.approved !== true ||
    authorization.verification !== validated ||
    authorization.targetEvent !== validated.targetEvent ||
    authorization.fromDate !== validated.fromDate ||
    authorization.toDate !== validated.toDate
  ) {
    throw authorizationError('Activation authorization does not match the exact verified next-event candidate.');
  }
  return true;
}

module.exports = {
  createNextEventGameStateCalendarActivationAuthorization,
  assertNextEventGameStateCalendarActivationAuthorized
};
