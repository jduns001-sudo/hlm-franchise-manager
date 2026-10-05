'use strict';

/**
 * Phase 3 Mission 110: existing-slot calendar replacement readiness gate.
 * Determines whether a verified isolated candidate may proceed toward replacing
 * a separate occupied target slot. Performs no writes.
 */

function readinessError(message) {
  const error = new Error(message);
  error.code = 'CALENDAR_REPLACEMENT_NOT_READY';
  return error;
}

function evaluateExistingSlotCalendarReplacementReadiness(input = {}) {
  const reload = input.reloadVerification;
  const checkpoint = input.checkpoint;
  const repository = input.repository;
  const targetSlotId = typeof input.targetSlotId === 'string' ? input.targetSlotId.trim() : '';
  const storageKey = typeof input.storageKey === 'string' ? input.storageKey.trim() : '';

  if (
    !reload ||
    reload.kind !== 'persisted-calendar-gamestate-reload-verification' ||
    reload.version !== 1 ||
    reload.verified !== true ||
    typeof reload.slotId !== 'string' ||
    !reload.slotId.trim() ||
    !reload.verification ||
    !reload.state
  ) throw readinessError('Verified persisted calendar GameState reload is required.');

  if (!repository || typeof repository.has !== 'function') {
    throw readinessError('A repository with slot lookup capability is required.');
  }
  if (!targetSlotId || !storageKey) {
    throw readinessError('Exact target slot and storage key are required.');
  }
  if (targetSlotId === reload.slotId) {
    throw readinessError('Verified candidate staging slot must remain separate from the occupied target slot.');
  }
  if (!repository.has(targetSlotId)) {
    throw readinessError('Target save slot must already exist before replacement can be considered.');
  }

  if (
    !checkpoint ||
    checkpoint.kind !== 'calendar-persistence-recovery-checkpoint' ||
    checkpoint.version !== 1 ||
    checkpoint.verified !== true ||
    checkpoint.slotId !== targetSlotId ||
    checkpoint.storageKey !== storageKey ||
    checkpoint.saveStoreValue === null
  ) {
    throw readinessError('Verified recovery checkpoint for the exact occupied target is required.');
  }

  return Object.freeze({
    kind: 'existing-slot-calendar-replacement-readiness',
    version: 1,
    ready: true,
    replacementAuthorized: false,
    replacementPerformed: false,
    candidateSlotId: reload.slotId,
    targetSlotId,
    storageKey,
    fromDate: reload.fromDate,
    toDate: reload.toDate,
    reloadVerification: reload,
    checkpoint,
    requirements: Object.freeze({
      explicitReplacementAuthorizationRequired: true,
      verifyAfterReplacementRequired: true,
      restoreCheckpointOnFailureRequired: true
    })
  });
}

module.exports = { evaluateExistingSlotCalendarReplacementReadiness };
