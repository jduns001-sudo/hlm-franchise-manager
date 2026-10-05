'use strict';

/**
 * Phase 3 Mission 118: calendar replacement cleanup verification.
 * Independently verifies the Mission 117 cleanup result without writes:
 * the staging slot is gone, the durable target still equals the authorized
 * candidate, the recovery checkpoint is preserved, and 115 -> 116 -> 117
 * lineage remains exact.
 */

const { validateGameStateEnvelope } = require('./hlm-game-state');
const { serializeGameState } = require('./hlm-game-state-serialization');

function verificationError(message) {
  const error = new Error(message);
  error.code = 'CALENDAR_REPLACEMENT_CLEANUP_VERIFICATION_FAILED';
  return error;
}

function verifyCalendarReplacementCleanup(input = {}) {
  const execution = input.execution;
  const repository = input.repository;

  if (
    !execution ||
    execution.kind !== 'calendar-replacement-cleanup-execution' ||
    execution.version !== 1 ||
    execution.executed !== true ||
    execution.verified !== true ||
    execution.stagingSlotRemoved !== true ||
    execution.checkpointPreserved !== true ||
    !execution.readiness ||
    !execution.authorization ||
    !execution.completion ||
    !execution.checkpoint ||
    execution.authorization.readiness !== execution.readiness ||
    execution.authorization.completion !== execution.completion ||
    execution.authorization.checkpoint !== execution.checkpoint ||
    execution.readiness.completion !== execution.completion ||
    execution.readiness.checkpoint !== execution.checkpoint ||
    execution.candidateSlotId !== execution.authorization.candidateSlotId ||
    execution.targetSlotId !== execution.authorization.targetSlotId ||
    execution.storageKey !== execution.authorization.storageKey ||
    execution.fromDate !== execution.authorization.fromDate ||
    execution.toDate !== execution.authorization.toDate
  ) {
    throw verificationError('A valid Mission 117 cleanup execution with exact 115/116 lineage is required.');
  }

  if (!repository || typeof repository.has !== 'function' || typeof repository.load !== 'function') {
    throw verificationError('A repository with slot lookup and load capability is required.');
  }
  if (repository.storageKey !== execution.storageKey) {
    throw verificationError('Repository storage key does not match the cleanup execution.');
  }
  if (repository.has(execution.candidateSlotId)) {
    throw verificationError('Temporary staging slot still exists after cleanup.');
  }
  if (!repository.has(execution.targetSlotId)) {
    throw verificationError('Permanent replacement target is missing after cleanup.');
  }

  let state;
  try {
    state = repository.load(execution.targetSlotId).state;
  } catch (_) {
    throw verificationError('Permanent replacement target could not be freshly reloaded.');
  }

  const candidateState = execution.completion.execution?.candidateState;
  if (
    !candidateState ||
    !state ||
    !validateGameStateEnvelope(state).valid ||
    state.meta.currentDate !== execution.toDate ||
    serializeGameState(state) !== serializeGameState(candidateState)
  ) {
    throw verificationError('Permanent replacement target does not exactly match the authorized candidate.');
  }

  return Object.freeze({
    kind: 'calendar-replacement-cleanup-verification',
    version: 1,
    verified: true,
    stagingSlotAbsent: true,
    targetMatchesAuthorizedCandidate: true,
    checkpointPreserved: true,
    lineageIntact: true,
    candidateSlotId: execution.candidateSlotId,
    targetSlotId: execution.targetSlotId,
    storageKey: execution.storageKey,
    fromDate: execution.fromDate,
    toDate: execution.toDate,
    execution,
    readiness: execution.readiness,
    authorization: execution.authorization,
    completion: execution.completion,
    checkpoint: execution.checkpoint,
    state
  });
}

module.exports = { verifyCalendarReplacementCleanup };
