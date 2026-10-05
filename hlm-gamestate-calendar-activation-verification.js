'use strict';

/**
 * Phase 3 Mission 101: isolated GameState calendar activation verification.
 * Independently confirms activation preserved the exact authorized candidate lineage.
 */

const { validateGameStateEnvelope } = require('./hlm-game-state');
const { assertGameStateCalendarActivationAuthorized } = require('./hlm-gamestate-calendar-activation-authorization');

function verificationError(message) {
  const error = new Error(message);
  error.code = 'GAMESTATE_CALENDAR_ACTIVATION_VERIFICATION_FAILED';
  return error;
}

function verifyIsolatedGameStateCalendarActivation(input = {}) {
  const activation = input.activation;
  if (
    !activation ||
    activation.kind !== 'isolated-gamestate-calendar-activation' ||
    activation.version !== 1 ||
    activation.activated !== true ||
    !activation.verification ||
    !activation.authorization ||
    !validateGameStateEnvelope(activation.state).valid
  ) {
    throw verificationError('A valid isolated GameState calendar activation is required.');
  }

  const verification = activation.verification;
  try {
    assertGameStateCalendarActivationAuthorized(verification, activation.authorization);
  } catch (_) {
    throw verificationError('Activation authorization does not match its verified candidate.');
  }

  if (
    activation.fromDate !== verification.fromDate ||
    activation.toDate !== verification.toDate ||
    activation.state !== verification.candidate.state ||
    activation.state.meta.currentDate !== verification.toDate ||
    verification.sourceState.meta.currentDate !== verification.fromDate
  ) {
    throw verificationError('Activated GameState does not match the exact authorized candidate lineage.');
  }

  return Object.freeze({
    kind: 'isolated-gamestate-calendar-activation-verification',
    version: 1,
    verified: true,
    fromDate: activation.fromDate,
    toDate: activation.toDate,
    activation
  });
}

module.exports = { verifyIsolatedGameStateCalendarActivation };
