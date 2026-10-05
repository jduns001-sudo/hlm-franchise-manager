'use strict';

/**
 * Phase 3 Mission 129: next-event GameState calendar candidate.
 * Converts one exact Mission 128 verification into an isolated candidate state
 * by delegating the date-only change to the existing Mission 97 boundary.
 * No activation, persistence, event processing, or UI wiring.
 */

const { validateGameStateEnvelope } = require('./hlm-game-state');
const { createGameStateCalendarAdvancementCandidate } = require('./hlm-gamestate-calendar-advancement-candidate');

function candidateError(message) {
  const error = new Error(message);
  error.code = 'INVALID_NEXT_EVENT_GAMESTATE_CALENDAR_CANDIDATE';
  return error;
}

function createNextEventGameStateCalendarCandidate(input = {}) {
  const state = input.state;
  const verification = input.verification;

  if (!validateGameStateEnvelope(state).valid) {
    throw candidateError('A valid source GameState envelope is required.');
  }
  if (
    !verification ||
    verification.kind !== 'next-event-calendar-advancement-verification' ||
    verification.version !== 1 ||
    verification.verified !== true ||
    verification.targetEventReached !== true ||
    verification.lineageIntact !== true ||
    !verification.targetEvent ||
    verification.targetEvent.date !== verification.toDate ||
    !verification.advancementVerification ||
    verification.advancementVerification.kind !== 'calendar-advancement-verification' ||
    verification.advancementVerification.verified !== true ||
    verification.advancementVerification.fromDate !== verification.fromDate ||
    verification.advancementVerification.toDate !== verification.toDate
  ) {
    throw candidateError('A valid exact Mission 128 next-event verification is required.');
  }
  if (state.meta.currentDate !== verification.fromDate) {
    throw candidateError('GameState current date does not match the verified next-event source date.');
  }

  let calendarCandidate;
  try {
    calendarCandidate = createGameStateCalendarAdvancementCandidate({
      state,
      verification: verification.advancementVerification
    });
  } catch (_) {
    throw candidateError('Underlying GameState calendar candidate could not be created.');
  }

  if (
    calendarCandidate.fromDate !== verification.fromDate ||
    calendarCandidate.toDate !== verification.toDate ||
    calendarCandidate.state.meta.currentDate !== verification.targetEvent.date
  ) {
    throw candidateError('Underlying candidate does not match the verified target event.');
  }

  return Object.freeze({
    kind: 'next-event-gamestate-calendar-candidate',
    version: 1,
    fromDate: verification.fromDate,
    toDate: verification.toDate,
    targetEvent: verification.targetEvent,
    verification,
    calendarCandidate,
    state: calendarCandidate.state
  });
}

module.exports = { createNextEventGameStateCalendarCandidate };
