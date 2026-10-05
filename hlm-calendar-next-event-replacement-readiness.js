'use strict';

/**
 * Phase 3 Mission 142: next-event existing-slot replacement readiness.
 * Read-only gate before any occupied target save replacement.
 */

function readinessError(message) {
  const error = new Error(message);
  error.code = 'NEXT_EVENT_CALENDAR_REPLACEMENT_NOT_READY';
  return error;
}

function evaluateExistingSlotNextEventCalendarReplacementReadiness(input = {}) {
  const reload = input.reloadVerification;
  const checkpoint = input.checkpoint;
  const repository = input.repository;
  const targetSlotId = typeof input.targetSlotId === 'string' ? input.targetSlotId.trim() : '';
  const storageKey = typeof input.storageKey === 'string' ? input.storageKey.trim() : '';

  if (
    !reload ||
    reload.kind !== 'persisted-next-event-calendar-gamestate-reload-verification' ||
    reload.version !== 1 ||
    reload.verified !== true ||
    typeof reload.slotId !== 'string' ||
    !reload.slotId.trim() ||
    !reload.targetEvent ||
    reload.targetEvent.date !== reload.toDate ||
    !reload.verification ||
    reload.verification.targetEvent !== reload.targetEvent ||
    !reload.state
  ) throw readinessError('Verified persisted next-event GameState reload is required.');

  if (!repository || typeof repository.has !== 'function') {
    throw readinessError('A repository with slot lookup capability is required.');
  }
  if (!targetSlotId || !storageKey) {
    throw readinessError('Exact target slot and storage key are required.');
  }
  if (targetSlotId === reload.slotId) {
    throw readinessError('Verified next-event candidate staging slot must remain separate from the occupied target slot.');
  }
  if (!repository.has(targetSlotId)) {
    throw readinessError('Target save slot must already exist before replacement can be considered.');
  }

  if (
    !checkpoint ||
    checkpoint.kind !== 'next-event-calendar-persistence-recovery-checkpoint' ||
    checkpoint.version !== 1 ||
    checkpoint.verified !== true ||
    checkpoint.slotId !== targetSlotId ||
    checkpoint.storageKey !== storageKey ||
    checkpoint.saveStoreValue === null
  ) {
    throw readinessError('Verified next-event recovery checkpoint for the exact occupied target is required.');
  }

  return Object.freeze({
    kind: 'existing-slot-next-event-calendar-replacement-readiness',
    version: 1,
    ready: true,
    replacementAuthorized: false,
    replacementPerformed: false,
    candidateSlotId: reload.slotId,
    targetSlotId,
    storageKey,
    fromDate: reload.fromDate,
    toDate: reload.toDate,
    targetEvent: reload.targetEvent,
    reloadVerification: reload,
    checkpoint,
    requirements: Object.freeze({
      explicitReplacementAuthorizationRequired: true,
      verifyAfterReplacementRequired: true,
      restoreCheckpointOnFailureRequired: true
    })
  });
}

module.exports = { evaluateExistingSlotNextEventCalendarReplacementReadiness };
