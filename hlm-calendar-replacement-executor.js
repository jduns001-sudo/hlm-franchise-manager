'use strict';

/**
 * Phase 3 Mission 112: existing-slot calendar replacement executor.
 * Executes one exact Mission 111 authorization against an explicitly supplied
 * repository, verifies the durable result, and restores the Mission 109
 * checkpoint on failure.
 */

const { validateGameStateEnvelope } = require('./hlm-game-state');
const { serializeGameState } = require('./hlm-game-state-serialization');
const { assertExistingSlotCalendarReplacementAuthorized } = require('./hlm-calendar-replacement-authorization');
const { restoreCalendarPersistenceRecoveryCheckpoint } = require('./hlm-calendar-persistence-recovery-checkpoint');

function executionError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function executeExistingSlotCalendarReplacement(input = {}) {
  const readiness = input.readiness;
  const authorization = input.authorization;
  const repository = input.repository;
  const storage = input.storage;

  try {
    assertExistingSlotCalendarReplacementAuthorized(readiness, authorization);
  } catch (_) {
    throw executionError(
      'CALENDAR_REPLACEMENT_EXECUTION_NOT_AUTHORIZED',
      'Exact existing-slot calendar replacement authorization is required.'
    );
  }

  if (!repository || typeof repository.save !== 'function' || typeof repository.load !== 'function' ||
      typeof repository.has !== 'function') {
    throw executionError('INVALID_CALENDAR_REPLACEMENT_REPOSITORY', 'A save repository is required.');
  }
  if (repository.storageKey !== authorization.storageKey) {
    throw executionError('CALENDAR_REPLACEMENT_STORAGE_MISMATCH', 'Repository storage key does not match authorization.');
  }
  if (!repository.has(authorization.targetSlotId)) {
    throw executionError('CALENDAR_REPLACEMENT_TARGET_MISSING', 'Authorized target save slot must exist.');
  }

  const candidateState = authorization.candidateState;
  if (!validateGameStateEnvelope(candidateState).valid ||
      candidateState.meta.currentDate !== authorization.toDate) {
    throw executionError('INVALID_CALENDAR_REPLACEMENT_CANDIDATE', 'Authorized replacement candidate is invalid.');
  }

  try {
    repository.save(
      authorization.targetSlotId,
      candidateState,
      { saveId: authorization.targetSlotId },
      { replace: true }
    );

    const loaded = repository.load(authorization.targetSlotId);
    if (!loaded || !loaded.state || !validateGameStateEnvelope(loaded.state).valid ||
        loaded.state.meta.currentDate !== authorization.toDate ||
        serializeGameState(loaded.state) !== serializeGameState(candidateState)) {
      throw executionError(
        'CALENDAR_REPLACEMENT_POST_WRITE_VERIFICATION_FAILED',
        'Replaced calendar GameState failed durable verification.'
      );
    }

    return Object.freeze({
      kind: 'existing-slot-calendar-replacement-execution',
      version: 1,
      executed: true,
      verified: true,
      rolledBack: false,
      candidateSlotId: authorization.candidateSlotId,
      targetSlotId: authorization.targetSlotId,
      storageKey: authorization.storageKey,
      fromDate: authorization.fromDate,
      toDate: authorization.toDate,
      readiness,
      authorization,
      checkpoint: authorization.checkpoint,
      candidateState
    });
  } catch (error) {
    try {
      const restoration = restoreCalendarPersistenceRecoveryCheckpoint({
        storage,
        checkpoint: authorization.checkpoint
      });
      error.persistenceRolledBack = restoration.restored === true;
      error.restoration = restoration;
    } catch (rollbackError) {
      error.persistenceRolledBack = false;
      error.rollbackError = rollbackError;
    }
    throw error;
  }
}

module.exports = { executeExistingSlotCalendarReplacement };
