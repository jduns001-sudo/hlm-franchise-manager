'use strict';

/**
 * Phase 3 Mission 123: calendar recovery checkpoint retirement verification.
 * Independently verifies one exact Mission 122 retirement execution without
 * writes, deletion, calendar advancement, or Front Office wiring.
 */

const { validateGameStateEnvelope } = require('./hlm-game-state');
const { serializeGameState } = require('./hlm-game-state-serialization');

function verificationError(message) {
  const error = new Error(message);
  error.code = 'CALENDAR_RECOVERY_CHECKPOINT_RETIREMENT_VERIFICATION_FAILED';
  return error;
}

function verifyCalendarRecoveryCheckpointRetirement(input = {}) {
  const execution = input.execution;
  const repository = input.repository;

  if (
    !execution ||
    execution.kind !== 'calendar-recovery-checkpoint-retirement-execution' ||
    execution.version !== 1 ||
    execution.executed !== true ||
    execution.verified !== true ||
    execution.checkpointRetired !== true ||
    execution.rollbackAuthorityRetired !== true ||
    execution.storageDeleted !== false ||
    execution.durableTargetPreserved !== true ||
    execution.stagingSlotAbsent !== true ||
    !execution.readiness ||
    !execution.authorization ||
    !execution.completion ||
    !execution.verification ||
    !execution.retiredCheckpoint ||
    !execution.state
  ) {
    throw verificationError('A valid Mission 122 checkpoint retirement execution is required.');
  }

  const readiness = execution.readiness;
  const authorization = execution.authorization;
  if (
    readiness.kind !== 'calendar-recovery-checkpoint-retirement-readiness' ||
    readiness.version !== 1 ||
    readiness.ready !== true ||
    readiness.checkpointStillPreserved !== true ||
    authorization.kind !== 'calendar-recovery-checkpoint-retirement-authorization' ||
    authorization.version !== 1 ||
    authorization.approved !== true ||
    authorization.executed !== false ||
    authorization.readiness !== readiness ||
    authorization.completion !== execution.completion ||
    authorization.verification !== execution.verification ||
    authorization.checkpoint !== execution.retiredCheckpoint ||
    authorization.state !== readiness.state ||
    readiness.completion !== execution.completion ||
    readiness.verification !== execution.verification ||
    readiness.checkpoint !== execution.retiredCheckpoint ||
    execution.candidateSlotId !== authorization.candidateSlotId ||
    execution.targetSlotId !== authorization.targetSlotId ||
    execution.storageKey !== authorization.storageKey ||
    execution.fromDate !== authorization.fromDate ||
    execution.toDate !== authorization.toDate
  ) {
    throw verificationError('Mission 120/121/122 retirement lineage is inconsistent.');
  }

  if (!repository || typeof repository.has !== 'function' || typeof repository.load !== 'function') {
    throw verificationError('A repository with slot lookup and load capability is required.');
  }
  if (repository.storageKey !== execution.storageKey) {
    throw verificationError('Repository storage key does not match retirement execution.');
  }
  if (repository.has(execution.candidateSlotId)) {
    throw verificationError('Temporary staging slot exists after checkpoint retirement.');
  }
  if (!repository.has(execution.targetSlotId)) {
    throw verificationError('Durable replacement target is missing after checkpoint retirement.');
  }

  let state;
  try {
    state = repository.load(execution.targetSlotId).state;
  } catch (_) {
    throw verificationError('Durable replacement target could not be freshly reloaded.');
  }

  if (
    !state ||
    !validateGameStateEnvelope(state).valid ||
    state.meta.currentDate !== execution.toDate ||
    serializeGameState(state) !== serializeGameState(execution.state) ||
    serializeGameState(state) !== serializeGameState(authorization.state)
  ) {
    throw verificationError('Durable replacement target changed after checkpoint retirement.');
  }

  return Object.freeze({
    kind: 'calendar-recovery-checkpoint-retirement-verification',
    version: 1,
    verified: true,
    checkpointRetirementVerified: true,
    rollbackAuthorityRetired: true,
    storagePreserved: true,
    durableTargetPreserved: true,
    stagingSlotAbsent: true,
    lineageIntact: true,
    candidateSlotId: execution.candidateSlotId,
    targetSlotId: execution.targetSlotId,
    storageKey: execution.storageKey,
    fromDate: execution.fromDate,
    toDate: execution.toDate,
    execution,
    readiness,
    authorization,
    completion: execution.completion,
    retiredCheckpoint: execution.retiredCheckpoint,
    state
  });
}

module.exports = { verifyCalendarRecoveryCheckpointRetirement };
