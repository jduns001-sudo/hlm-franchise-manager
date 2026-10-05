'use strict';

/**
 * Phase 3 Mission 132: isolated next-event GameState calendar activation.
 * Returns the exact Mission 130 verified candidate state in-memory only after
 * Mission 131 authorization. No persistence, event processing, or UI wiring.
 */

const { validateGameStateEnvelope } = require('./hlm-game-state');
const { assertNextEventGameStateCalendarActivationAuthorized } = require('./hlm-calendar-next-event-gamestate-activation-authorization');

function activationError(message) {
  const error = new Error(message);
  error.code = 'NEXT_EVENT_GAMESTATE_CALENDAR_ACTIVATION_FAILED';
  return error;
}

function activateNextEventGameStateCalendarCandidate(input = {}) {
  const verification = input.verification;
  const authorization = input.authorization;

  try {
    assertNextEventGameStateCalendarActivationAuthorized(verification, authorization);
  } catch (_) {
    throw activationError('Next-event GameState activation is not authorized for the exact verification.');
  }

  const candidate = verification.candidate;
  if (
    !candidate ||
    candidate.kind !== 'next-event-gamestate-calendar-candidate' ||
    candidate.version !== 1 ||
    candidate.state !== verification.state ||
    candidate.targetEvent !== verification.targetEvent ||
    !validateGameStateEnvelope(candidate.state).valid ||
    candidate.state.meta.currentDate !== verification.toDate ||
    verification.targetEvent.date !== verification.toDate
  ) {
    throw activationError('The authorized next-event GameState candidate is invalid.');
  }

  return Object.freeze({
    kind: 'isolated-next-event-gamestate-calendar-activation',
    version: 1,
    activated: true,
    fromDate: verification.fromDate,
    toDate: verification.toDate,
    targetEvent: verification.targetEvent,
    verification,
    authorization,
    state: candidate.state
  });
}

module.exports = { activateNextEventGameStateCalendarCandidate };
