'use strict';

/**
 * Phase 3 Mission 97: GameState calendar advancement candidate.
 * Prepares a new candidate state only. Does not persist, activate, or mutate input.
 */

const { validateGameStateEnvelope } = require('./hlm-game-state');

function candidateError(message) {
  const error = new Error(message);
  error.code = 'INVALID_GAMESTATE_CALENDAR_CANDIDATE';
  return error;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createGameStateCalendarAdvancementCandidate(input = {}) {
  const state = input.state;
  const verification = input.verification;
  const validation = validateGameStateEnvelope(state);

  if (!validation.valid) {
    throw candidateError('A valid GameState envelope is required.');
  }
  if (
    !verification ||
    verification.kind !== 'calendar-advancement-verification' ||
    verification.version !== 1 ||
    verification.verified !== true ||
    typeof verification.fromDate !== 'string' ||
    typeof verification.toDate !== 'string' ||
    !verification.result ||
    !verification.result.calendar ||
    verification.result.calendar.currentDate !== verification.toDate
  ) {
    throw candidateError('A verified calendar advancement is required.');
  }
  if (state.meta.currentDate !== verification.fromDate) {
    throw candidateError('GameState current date does not match the verified advancement source date.');
  }

  const candidateState = clone(state);
  candidateState.meta.currentDate = verification.toDate;

  const candidateValidation = validateGameStateEnvelope(candidateState);
  if (!candidateValidation.valid) {
    throw candidateError('Calendar advancement produced an invalid GameState candidate.');
  }

  return Object.freeze({
    kind: 'gamestate-calendar-advancement-candidate',
    version: 1,
    fromDate: verification.fromDate,
    toDate: verification.toDate,
    verification,
    state: candidateState
  });
}

module.exports = { createGameStateCalendarAdvancementCandidate };
