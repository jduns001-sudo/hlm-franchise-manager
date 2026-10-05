'use strict';

/**
 * Phase 3 Mission 108: persisted calendar GameState reload verification.
 * Verifies a fresh repository load against the independently verified execution.
 * Performs no writes.
 */

const { validateGameStateEnvelope } = require('./hlm-game-state');
const { serializeGameState } = require('./hlm-game-state-serialization');

function reloadError(message) {
  const error = new Error(message);
  error.code = 'CALENDAR_PERSISTENCE_RELOAD_VERIFICATION_FAILED';
  return error;
}

function verifyPersistedCalendarGameStateReload(input = {}) {
  const verification = input.verification;
  const repository = input.repository;

  if (
    !verification ||
    verification.kind !== 'calendar-persistence-execution-verification' ||
    verification.version !== 1 ||
    verification.verified !== true ||
    !verification.execution ||
    verification.execution.slotId !== verification.slotId ||
    verification.execution.fromDate !== verification.fromDate ||
    verification.execution.toDate !== verification.toDate
  ) {
    throw reloadError('A valid calendar persistence execution verification is required.');
  }
  if (!repository || typeof repository.load !== 'function') {
    throw reloadError('A repository with load capability is required.');
  }

  let loaded;
  try {
    loaded = repository.load(verification.slotId);
  } catch (_) {
    throw reloadError('Persisted calendar GameState could not be reloaded.');
  }

  const state = loaded && loaded.state;
  const expected = verification.execution.package?.candidateState;
  if (
    !state ||
    !expected ||
    !validateGameStateEnvelope(state).valid ||
    state.meta.currentDate !== verification.toDate
  ) {
    throw reloadError('Reloaded calendar GameState is invalid or has the wrong date.');
  }

  let equivalent = false;
  try {
    equivalent = serializeGameState(state) === serializeGameState(expected);
  } catch (_) {
    equivalent = false;
  }
  if (!equivalent) {
    throw reloadError('Reloaded calendar GameState does not match the persisted candidate.');
  }

  return Object.freeze({
    kind: 'persisted-calendar-gamestate-reload-verification',
    version: 1,
    verified: true,
    slotId: verification.slotId,
    fromDate: verification.fromDate,
    toDate: verification.toDate,
    verification,
    state
  });
}

module.exports = { verifyPersistedCalendarGameStateReload };
