'use strict';

/**
 * Phase 3 Mission 98: GameState calendar candidate verification.
 * Confirms the candidate differs from source only by the authorized current date.
 */

const { validateGameStateEnvelope } = require('./hlm-game-state');

function verificationError(message) {
  const error = new Error(message);
  error.code = 'GAMESTATE_CALENDAR_CANDIDATE_VERIFICATION_FAILED';
  return error;
}

function withoutCurrentDate(state) {
  const copy = JSON.parse(JSON.stringify(state));
  copy.meta.currentDate = null;
  return copy;
}

function verifyGameStateCalendarAdvancementCandidate(input = {}) {
  const sourceState = input.sourceState;
  const candidate = input.candidate;

  if (!validateGameStateEnvelope(sourceState).valid) {
    throw verificationError('A valid source GameState is required.');
  }
  if (
    !candidate ||
    candidate.kind !== 'gamestate-calendar-advancement-candidate' ||
    candidate.version !== 1 ||
    !candidate.verification ||
    candidate.verification.kind !== 'calendar-advancement-verification' ||
    candidate.verification.verified !== true ||
    !validateGameStateEnvelope(candidate.state).valid
  ) {
    throw verificationError('A valid GameState calendar advancement candidate is required.');
  }

  const verification = candidate.verification;
  if (
    sourceState.meta.currentDate !== candidate.fromDate ||
    verification.fromDate !== candidate.fromDate ||
    verification.toDate !== candidate.toDate ||
    candidate.state.meta.currentDate !== candidate.toDate
  ) {
    throw verificationError('Candidate dates do not match the verified advancement.');
  }

  if (JSON.stringify(withoutCurrentDate(sourceState)) !== JSON.stringify(withoutCurrentDate(candidate.state))) {
    throw verificationError('Candidate contains changes outside the authorized calendar date.');
  }

  return Object.freeze({
    kind: 'gamestate-calendar-candidate-verification',
    version: 1,
    verified: true,
    fromDate: candidate.fromDate,
    toDate: candidate.toDate,
    sourceState,
    candidate
  });
}

module.exports = { verifyGameStateCalendarAdvancementCandidate };
