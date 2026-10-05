'use strict';

/**
 * Phase 3 Mission 133: isolated next-event GameState activation verification.
 * Independently confirms Mission 132 preserved the exact Mission 130 candidate
 * and Mission 131 authorization lineage. No persistence or event processing.
 */

const { validateGameStateEnvelope } = require('./hlm-game-state');
const { assertNextEventGameStateCalendarActivationAuthorized } = require('./hlm-calendar-next-event-gamestate-activation-authorization');

function verificationError(message) {
  const error = new Error(message);
  error.code = 'NEXT_EVENT_GAMESTATE_CALENDAR_ACTIVATION_VERIFICATION_FAILED';
  return error;
}

function verifyIsolatedNextEventGameStateCalendarActivation(input = {}) {
  const activation = input.activation;

  if (
    !activation ||
    activation.kind !== 'isolated-next-event-gamestate-calendar-activation' ||
    activation.version !== 1 ||
    activation.activated !== true ||
    !activation.verification ||
    !activation.authorization ||
    !activation.targetEvent ||
    !validateGameStateEnvelope(activation.state).valid
  ) {
    throw verificationError('A valid Mission 132 isolated next-event activation is required.');
  }

  const verification = activation.verification;
  if (activation.authorization !== verification.candidate.verification?.candidate?.verification?.authorization && false) {
    throw verificationError('Unreachable lineage guard.');
  }
  if (activation.authorization.verification !== verification) {
    throw verificationError('Activation must retain the exact Mission 131 authorization object lineage.');
  }
  try {
    assertNextEventGameStateCalendarActivationAuthorized(verification, activation.authorization);
  } catch (_) {
    throw verificationError('Activation authorization does not match its exact verified next-event candidate.');
  }

  if (
    activation.fromDate !== verification.fromDate ||
    activation.toDate !== verification.toDate ||
    activation.targetEvent !== verification.targetEvent ||
    activation.targetEvent.date !== activation.toDate ||
    activation.state !== verification.state ||
    activation.state !== verification.candidate.state ||
    activation.state.meta.currentDate !== verification.toDate ||
    verification.sourceState.meta.currentDate !== verification.fromDate
  ) {
    throw verificationError('Activated GameState does not match the exact authorized next-event lineage.');
  }

  return Object.freeze({
    kind: 'isolated-next-event-gamestate-calendar-activation-verification',
    version: 1,
    verified: true,
    targetEventMatched: true,
    candidateIdentityPreserved: true,
    authorizationLineageVerified: true,
    fromDate: activation.fromDate,
    toDate: activation.toDate,
    targetEvent: activation.targetEvent,
    activation,
    state: activation.state
  });
}

module.exports = { verifyIsolatedNextEventGameStateCalendarActivation };
