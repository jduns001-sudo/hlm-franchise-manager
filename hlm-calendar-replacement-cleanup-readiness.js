'use strict';

/**
 * Phase 3 Mission 115: calendar replacement cleanup readiness gate.
 * Determines whether temporary staging/recovery artifacts may later be cleaned.
 * Performs no persistence writes or deletion.
 */

const { validateGameStateEnvelope } = require('./hlm-game-state');
const { serializeGameState } = require('./hlm-game-state-serialization');

function readinessError(message) {
  const error = new Error(message);
  error.code = 'CALENDAR_REPLACEMENT_CLEANUP_NOT_READY';
  return error;
}

function evaluateCalendarReplacementCleanupReadiness(input = {}) {
  const completion = input.completion;
  const repository = input.repository;

  if (
    !completion ||
    completion.kind !== 'calendar-replacement-transaction-completion' ||
    completion.version !== 1 ||
    completion.complete !== true ||
    completion.durableVerificationComplete !== true ||
    completion.cleanupPerformed !== false ||
    completion.checkpointPreserved !== true ||
    completion.stagingSlotPreserved !== true ||
    !completion.verification ||
    !completion.execution ||
    !completion.authorization ||
    !completion.checkpoint ||
    !completion.state ||
    completion.verification.execution !== completion.execution ||
    completion.verification.authorization !== completion.authorization ||
    completion.verification.checkpoint !== completion.checkpoint
  ) {
    throw readinessError('A complete, verified replacement transaction with preserved safety artifacts is required.');
  }

  if (!repository || typeof repository.has !== 'function' || typeof repository.load !== 'function') {
    throw readinessError('A repository with slot lookup and load capability is required.');
  }
  if (repository.storageKey !== completion.storageKey) {
    throw readinessError('Repository storage key does not match the completed transaction.');
  }
  if (!repository.has(completion.targetSlotId) || !repository.has(completion.candidateSlotId)) {
    throw readinessError('Both durable target and preserved staging slot must exist before cleanup can be considered.');
  }

  let target;
  try {
    target = repository.load(completion.targetSlotId);
  } catch (_) {
    throw readinessError('Durable replacement target could not be reloaded.');
  }
  const state = target && target.state;
  if (!state || !validateGameStateEnvelope(state).valid ||
      state.meta.currentDate !== completion.toDate ||
      serializeGameState(state) !== serializeGameState(completion.execution.candidateState)) {
    throw readinessError('Durable replacement target no longer matches the completed transaction.');
  }

  return Object.freeze({
    kind: 'calendar-replacement-cleanup-readiness',
    version: 1,
    ready: true,
    cleanupAuthorized: false,
    cleanupPerformed: false,
    candidateSlotId: completion.candidateSlotId,
    targetSlotId: completion.targetSlotId,
    storageKey: completion.storageKey,
    fromDate: completion.fromDate,
    toDate: completion.toDate,
    completion,
    checkpoint: completion.checkpoint,
    requirements: Object.freeze({
      explicitCleanupAuthorizationRequired: true,
      targetMustRemainDurable: true
    })
  });
}

module.exports = { evaluateCalendarReplacementCleanupReadiness };
