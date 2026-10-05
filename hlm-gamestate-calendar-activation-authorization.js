'use strict';

/**
 * Phase 3 Mission 99: GameState calendar activation authorization.
 * Explicit permission only. Does not activate or persist the candidate state.
 */

function authorizationError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function assertCandidateVerification(verification) {
  if (
    !verification ||
    verification.kind !== 'gamestate-calendar-candidate-verification' ||
    verification.version !== 1 ||
    verification.verified !== true ||
    typeof verification.fromDate !== 'string' ||
    typeof verification.toDate !== 'string' ||
    !verification.sourceState ||
    !verification.candidate ||
    verification.candidate.state?.meta?.currentDate !== verification.toDate
  ) {
    throw authorizationError(
      'INVALID_GAMESTATE_CALENDAR_ACTIVATION_AUTHORIZATION',
      'A verified GameState calendar candidate is required.'
    );
  }
  return verification;
}

function createGameStateCalendarActivationAuthorization(input = {}) {
  const verification = assertCandidateVerification(input.verification);
  if (input.approved !== true) {
    throw authorizationError(
      'GAMESTATE_CALENDAR_ACTIVATION_NOT_APPROVED',
      'GameState calendar activation requires explicit approval.'
    );
  }

  return Object.freeze({
    kind: 'gamestate-calendar-activation-authorization',
    version: 1,
    approved: true,
    fromDate: verification.fromDate,
    toDate: verification.toDate,
    verification
  });
}

function assertGameStateCalendarActivationAuthorized(verification, authorization) {
  const validatedVerification = assertCandidateVerification(verification);
  if (
    !authorization ||
    authorization.kind !== 'gamestate-calendar-activation-authorization' ||
    authorization.version !== 1 ||
    authorization.approved !== true ||
    authorization.verification !== validatedVerification ||
    authorization.fromDate !== validatedVerification.fromDate ||
    authorization.toDate !== validatedVerification.toDate
  ) {
    throw authorizationError(
      'GAMESTATE_CALENDAR_ACTIVATION_AUTHORIZATION_MISMATCH',
      'Activation authorization does not match the exact verified GameState candidate.'
    );
  }
  return true;
}

module.exports = {
  createGameStateCalendarActivationAuthorization,
  assertGameStateCalendarActivationAuthorized
};
