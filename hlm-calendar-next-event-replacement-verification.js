'use strict';

/**
 * Phase 3 Mission 145: next-event existing-slot replacement verification.
 * Freshly reloads the Mission 144 target and proves it still equals the exact
 * authorized Next Event candidate. Performs no writes.
 */

const { validateGameStateEnvelope } = require('./hlm-game-state');
const { serializeGameState } = require('./hlm-game-state-serialization');

function verificationError(message) {
  const error = new Error(message);
  error.code = 'NEXT_EVENT_CALENDAR_REPLACEMENT_VERIFICATION_FAILED';
  return error;
}

function verifyExistingSlotNextEventCalendarReplacement(input = {}) {
  const execution = input.execution;
  const repository = input.repository;

  if (
    !execution ||
    execution.kind !== 'existing-slot-next-event-calendar-replacement-execution' ||
    execution.version !== 1 ||
    execution.executed !== true ||
    execution.verified !== true ||
    execution.rolledBack !== false ||
    !execution.targetEvent ||
    execution.targetEvent.date !== execution.toDate ||
    !execution.authorization ||
    !execution.readiness ||
    execution.authorization.readiness !== execution.readiness ||
    execution.authorization.checkpoint !== execution.checkpoint ||
    execution.authorization.candidateState !== execution.candidateState ||
    execution.authorization.targetEvent !== execution.targetEvent ||
    execution.authorization.candidateSlotId !== execution.candidateSlotId ||
    execution.authorization.targetSlotId !== execution.targetSlotId ||
    execution.authorization.storageKey !== execution.storageKey ||
    execution.authorization.fromDate !== execution.fromDate ||
    execution.authorization.toDate !== execution.toDate
  ) {
    throw verificationError('A valid successful Mission 144 next-event replacement execution is required.');
  }

  if (!repository || typeof repository.load !== 'function' || typeof repository.has !== 'function') {
    throw verificationError('A repository with load and slot lookup capability is required.');
  }
  if (repository.storageKey !== execution.storageKey || !repository.has(execution.targetSlotId)) {
    throw verificationError('Replacement repository does not match the executed next-event target.');
  }

  let loaded;
  try { loaded = repository.load(execution.targetSlotId); }
  catch (_) { throw verificationError('Replaced next-event GameState could not be freshly reloaded.'); }

  const state = loaded && loaded.state;
  if (!state || !validateGameStateEnvelope(state).valid || state.meta.currentDate !== execution.toDate) {
    throw verificationError('Freshly reloaded next-event replacement GameState is invalid or has the wrong date.');
  }

  let equivalent = false;
  try { equivalent = serializeGameState(state) === serializeGameState(execution.candidateState); }
  catch (_) { equivalent = false; }
  if (!equivalent) {
    throw verificationError('Freshly reloaded next-event replacement does not match the authorized candidate.');
  }

  return Object.freeze({
    kind: 'existing-slot-next-event-calendar-replacement-verification',
    version: 1,
    verified: true,
    candidateSlotId: execution.candidateSlotId,
    targetSlotId: execution.targetSlotId,
    storageKey: execution.storageKey,
    fromDate: execution.fromDate,
    toDate: execution.toDate,
    targetEvent: execution.targetEvent,
    execution,
    authorization: execution.authorization,
    checkpoint: execution.checkpoint,
    state
  });
}

module.exports = { verifyExistingSlotNextEventCalendarReplacement };
