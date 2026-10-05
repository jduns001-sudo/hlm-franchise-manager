'use strict';

/**
 * Phase 3 Mission 140: persisted next-event GameState reload verification.
 * Freshly reloads the isolated slot and compares it to the exact candidate. No writes.
 */

const { validateGameStateEnvelope } = require('./hlm-game-state');
const { serializeGameState } = require('./hlm-game-state-serialization');

function reloadError(message) {
  const error = new Error(message);
  error.code = 'NEXT_EVENT_CALENDAR_PERSISTENCE_RELOAD_VERIFICATION_FAILED';
  return error;
}

function verifyPersistedNextEventCalendarGameStateReload(input = {}) {
  const verification = input.verification;
  const repository = input.repository;

  if (
    !verification ||
    verification.kind !== 'next-event-calendar-persistence-execution-verification' ||
    verification.version !== 1 ||
    verification.verified !== true ||
    !verification.targetEvent ||
    verification.targetEvent.date !== verification.toDate ||
    !verification.execution ||
    verification.execution.slotId !== verification.slotId ||
    verification.execution.fromDate !== verification.fromDate ||
    verification.execution.toDate !== verification.toDate ||
    verification.execution.targetEvent !== verification.targetEvent
  ) {
    throw reloadError('A valid Mission 139 next-event persistence execution verification is required.');
  }
  if (!repository || typeof repository.load !== 'function') {
    throw reloadError('A repository with load capability is required.');
  }

  let loaded;
  try {
    loaded = repository.load(verification.slotId);
  } catch (_) {
    throw reloadError('Persisted next-event GameState could not be reloaded.');
  }

  const state = loaded && loaded.state;
  const expected = verification.execution.package?.candidateState;
  if (
    !state ||
    !expected ||
    !validateGameStateEnvelope(state).valid ||
    state.meta.currentDate !== verification.toDate ||
    expected.meta?.currentDate !== verification.toDate
  ) {
    throw reloadError('Reloaded next-event GameState is invalid or has the wrong date.');
  }

  let equivalent = false;
  try {
    equivalent = serializeGameState(state) === serializeGameState(expected);
  } catch (_) {
    equivalent = false;
  }
  if (!equivalent) {
    throw reloadError('Reloaded next-event GameState does not match the persisted candidate.');
  }

  return Object.freeze({
    kind: 'persisted-next-event-calendar-gamestate-reload-verification',
    version: 1,
    verified: true,
    slotId: verification.slotId,
    fromDate: verification.fromDate,
    toDate: verification.toDate,
    targetEvent: verification.targetEvent,
    verification,
    state
  });
}

module.exports = { verifyPersistedNextEventCalendarGameStateReload };
