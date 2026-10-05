'use strict';

/**
 * Phase 3 Mission 130: next-event GameState candidate verification.
 * Independently verifies the Mission 129 wrapper and delegates the date-only
 * state comparison to the existing Mission 98 verifier.
 */

const { validateGameStateEnvelope } = require('./hlm-game-state');
const { verifyGameStateCalendarAdvancementCandidate } = require('./hlm-gamestate-calendar-candidate-verification');

function verificationError(message) {
  const error = new Error(message);
  error.code = 'NEXT_EVENT_GAMESTATE_CALENDAR_CANDIDATE_VERIFICATION_FAILED';
  return error;
}

function verifyNextEventGameStateCalendarCandidate(input = {}) {
  const sourceState = input.sourceState;
  const candidate = input.candidate;

  if (!validateGameStateEnvelope(sourceState).valid) {
    throw verificationError('A valid source GameState envelope is required.');
  }
  if (
    !candidate ||
    candidate.kind !== 'next-event-gamestate-calendar-candidate' ||
    candidate.version !== 1 ||
    !candidate.verification ||
    candidate.verification.kind !== 'next-event-calendar-advancement-verification' ||
    candidate.verification.verified !== true ||
    candidate.verification.targetEventReached !== true ||
    candidate.verification.lineageIntact !== true ||
    !candidate.calendarCandidate ||
    candidate.state !== candidate.calendarCandidate.state ||
    candidate.targetEvent !== candidate.verification.targetEvent ||
    candidate.fromDate !== candidate.verification.fromDate ||
    candidate.toDate !== candidate.verification.toDate ||
    candidate.targetEvent.date !== candidate.toDate
  ) {
    throw verificationError('A valid exact Mission 129 next-event candidate is required.');
  }

  let calendarCandidateVerification;
  try {
    calendarCandidateVerification = verifyGameStateCalendarAdvancementCandidate({
      sourceState,
      candidate: candidate.calendarCandidate
    });
  } catch (_) {
    throw verificationError('Underlying GameState calendar candidate verification failed.');
  }

  if (
    calendarCandidateVerification.fromDate !== candidate.fromDate ||
    calendarCandidateVerification.toDate !== candidate.toDate ||
    calendarCandidateVerification.candidate !== candidate.calendarCandidate ||
    candidate.state.meta.currentDate !== candidate.targetEvent.date
  ) {
    throw verificationError('Candidate does not match the verified next-event target.');
  }

  return Object.freeze({
    kind: 'next-event-gamestate-calendar-candidate-verification',
    version: 1,
    verified: true,
    dateOnlyChangeVerified: true,
    targetEventMatched: true,
    fromDate: candidate.fromDate,
    toDate: candidate.toDate,
    targetEvent: candidate.targetEvent,
    sourceState,
    candidate,
    calendarCandidateVerification,
    state: candidate.state
  });
}

module.exports = { verifyNextEventGameStateCalendarCandidate };
