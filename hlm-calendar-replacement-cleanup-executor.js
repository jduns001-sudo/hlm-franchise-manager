'use strict';

/**
 * Phase 3 Mission 117: isolated calendar replacement cleanup executor.
 * Removes only the authorized temporary staging slot after re-verifying the
 * durable target. The recovery checkpoint remains preserved in the result.
 */

const { assertCalendarReplacementCleanupAuthorized } = require('./hlm-calendar-replacement-cleanup-authorization');
const { validateGameStateEnvelope } = require('./hlm-game-state');
const { serializeGameState } = require('./hlm-game-state-serialization');

function cleanupError(message) {
  const error = new Error(message);
  error.code = 'CALENDAR_REPLACEMENT_CLEANUP_EXECUTION_FAILED';
  return error;
}

function executeCalendarReplacementCleanup(input = {}) {
  const readiness = input.readiness;
  const authorization = input.authorization;
  const repository = input.repository;

  try {
    assertCalendarReplacementCleanupAuthorized(readiness, authorization);
  } catch (_) {
    throw cleanupError('Cleanup is not authorized for the exact readiness result.');
  }

  if (!repository || typeof repository.has !== 'function' ||
      typeof repository.load !== 'function' || typeof repository.remove !== 'function') {
    throw cleanupError('A repository with slot lookup, load, and remove capability is required.');
  }
  if (repository.storageKey !== authorization.storageKey) {
    throw cleanupError('Repository storage key does not match cleanup authorization.');
  }
  if (!repository.has(authorization.targetSlotId) || !repository.has(authorization.candidateSlotId)) {
    throw cleanupError('Authorized target and staging slots must both exist before cleanup.');
  }

  const candidateState = authorization.completion.execution?.candidateState;
  let targetBefore;
  try {
    targetBefore = repository.load(authorization.targetSlotId).state;
  } catch (_) {
    throw cleanupError('Durable replacement target could not be loaded before cleanup.');
  }
  if (!candidateState || !targetBefore || !validateGameStateEnvelope(targetBefore).valid ||
      targetBefore.meta.currentDate !== authorization.toDate ||
      serializeGameState(targetBefore) !== serializeGameState(candidateState)) {
    throw cleanupError('Durable replacement target no longer matches the authorized candidate.');
  }
  const targetSerialized = serializeGameState(targetBefore);

  try {
    repository.remove(authorization.candidateSlotId);
  } catch (cause) {
    const error = cleanupError('Temporary staging slot could not be removed.');
    error.cause = cause;
    throw error;
  }

  if (repository.has(authorization.candidateSlotId)) {
    throw cleanupError('Temporary staging slot still exists after cleanup.');
  }

  let targetAfter;
  try {
    targetAfter = repository.load(authorization.targetSlotId).state;
  } catch (_) {
    throw cleanupError('Durable replacement target could not be loaded after cleanup.');
  }
  if (!targetAfter || !validateGameStateEnvelope(targetAfter).valid ||
      targetAfter.meta.currentDate !== authorization.toDate ||
      serializeGameState(targetAfter) !== targetSerialized) {
    throw cleanupError('Durable replacement target changed during staging cleanup.');
  }

  return Object.freeze({
    kind: 'calendar-replacement-cleanup-execution',
    version: 1,
    executed: true,
    verified: true,
    stagingSlotRemoved: true,
    checkpointPreserved: true,
    candidateSlotId: authorization.candidateSlotId,
    targetSlotId: authorization.targetSlotId,
    storageKey: authorization.storageKey,
    fromDate: authorization.fromDate,
    toDate: authorization.toDate,
    readiness,
    authorization,
    completion: authorization.completion,
    checkpoint: authorization.checkpoint,
    state: targetAfter
  });
}

module.exports = { executeCalendarReplacementCleanup };
