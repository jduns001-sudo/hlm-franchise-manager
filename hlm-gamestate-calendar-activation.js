'use strict';

/**
 * Phase 3 Mission 100: isolated GameState calendar activation.
 * Returns the exact authorized candidate state in-memory only.
 */

const { validateGameStateEnvelope } = require('./hlm-game-state');
const { assertGameStateCalendarActivationAuthorized } = require('./hlm-gamestate-calendar-activation-authorization');

function activationError(message) {
  const error = new Error(message);
  error.code = 'GAMESTATE_CALENDAR_ACTIVATION_FAILED';
  return error;
}

function activateGameStateCalendarCandidate(input = {}) {
  const verification = input.verification;
  const authorization = input.authorization;

  assertGameStateCalendarActivationAuthorized(verification, authorization);

  const candidate = verification.candidate;
  if (
    !candidate ||
    candidate.kind !== 'gamestate-calendar-advancement-candidate' ||
    candidate.version !== 1 ||
    !validateGameStateEnvelope(candidate.state).valid ||
    candidate.state.meta.currentDate !== verification.toDate
  ) {
    throw activationError('The authorized GameState calendar candidate is invalid.');
  }

  return Object.freeze({
    kind: 'isolated-gamestate-calendar-activation',
    version: 1,
    activated: true,
    fromDate: verification.fromDate,
    toDate: verification.toDate,
    verification,
    authorization,
    state: candidate.state
  });
}

module.exports = { activateGameStateCalendarCandidate };
