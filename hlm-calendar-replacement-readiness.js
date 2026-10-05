'use strict';

/**
 * Phase 3 Mission 110: existing-slot calendar replacement readiness gate.
 * Determines whether replacement may proceed to a later authorization step.
 * Performs no writes.
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
  const slotId = typeof input.slotId === 'string' ? input.slotId.trim() : '';
  const storageKey = typeof input.storageKey === 'string' ? input.storageKey.trim() : '';

  if (
    !reload ||
    reload.kind !== 'persisted-calendar-gamestate-reload-verification' ||
    reload.version !== 1 ||
    reload.verified !== true ||
    !reload.verification ||
    !reload.state
  ) throw readinessError('Verified persisted calendar GameState reload is required.');

  if (!repository || typeof repository.has !== 'function') {
    throw readinessError('A repository with slot lookup capability is required.');
  }
  if (!slotId || !storageKey || slotId !== reload.slotId) {
    throw readinessError('Exact target slot and storage key are required.');
  }
  if (!repository.has(slotId)) {
    throw readinessError('Target save slot must already exist before replacement can be considered.');
  }

  if (
    !checkpoint ||
    checkpoint.kind !== 'calendar-persistence-recovery-checkpoint' ||
    checkpoint.version !== 1 ||
    checkpoint.verified !== true ||
    checkpoint.slotId !== slotId ||
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
    slotId,
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
