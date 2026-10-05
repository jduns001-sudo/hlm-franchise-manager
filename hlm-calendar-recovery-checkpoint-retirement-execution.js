'use strict';

/**
 * Phase 3 Mission 122: calendar recovery checkpoint retirement execution.
 * Retires rollback authority for one exact Mission 121 authorization only after
 * freshly verifying the durable target. The checkpoint is an immutable
 * in-memory recovery object, so retirement performs no storage deletion.
 */

const { assertCalendarRecoveryCheckpointRetirementAuthorized } = require('./hlm-calendar-recovery-checkpoint-retirement-authorization');
const { validateGameStateEnvelope } = require('./hlm-game-state');
const { serializeGameState } = require('./hlm-game-state-serialization');

function executionError(message) {
  const error = new Error(message);
  error.code = 'CALENDAR_RECOVERY_CHECKPOINT_RETIREMENT_EXECUTION_FAILED';
  return error;
}

function executeCalendarRecoveryCheckpointRetirement(input = {}) {
  const readiness = input.readiness;
  const authorization = input.authorization;
  const repository = input.repository;

  try {
    assertCalendarRecoveryCheckpointRetirementAuthorized(readiness, authorization);
  } catch (_) {
    throw executionError('Checkpoint retirement is not authorized for the exact readiness result.');
  }

  if (!repository || typeof repository.has !== 'function' || typeof repository.load !== 'function') {
    throw executionError('A repository with slot lookup and load capability is required.');
  }
  if (repository.storageKey !== authorization.storageKey) {
    throw executionError('Repository storage key does not match retirement authorization.');
  }
  if (repository.has(authorization.candidateSlotId)) {
    throw executionError('Temporary staging slot reappeared before checkpoint retirement.');
  }
  if (!repository.has(authorization.targetSlotId)) {
    throw executionError('Durable replacement target is missing before checkpoint retirement.');
  }

  let durableState;
  try {
    durableState = repository.load(authorization.targetSlotId).state;
  } catch (_) {
    throw executionError('Durable replacement target could not be freshly reloaded.');
  }

  const expectedState = authorization.state;
  if (
    !durableState ||
    !validateGameStateEnvelope(durableState).valid ||
    durableState.meta.currentDate !== authorization.toDate ||
    serializeGameState(durableState) !== serializeGameState(expectedState)
  ) {
    throw executionError('Durable replacement target no longer matches the authorized verified state.');
  }

  return Object.freeze({
    kind: 'calendar-recovery-checkpoint-retirement-execution',
    version: 1,
    executed: true,
    verified: true,
    checkpointRetired: true,
    rollbackAuthorityRetired: true,
    storageDeleted: false,
    durableTargetPreserved: true,
    stagingSlotAbsent: true,
    candidateSlotId: authorization.candidateSlotId,
    targetSlotId: authorization.targetSlotId,
    storageKey: authorization.storageKey,
    fromDate: authorization.fromDate,
    toDate: authorization.toDate,
    readiness,
    authorization,
    completion: authorization.completion,
    verification: authorization.verification,
    retiredCheckpoint: authorization.checkpoint,
    state: durableState
  });
}

module.exports = { executeCalendarRecoveryCheckpointRetirement };
