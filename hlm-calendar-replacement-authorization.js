'use strict';

/**
 * Phase 3 Mission 111: existing-slot calendar replacement authorization gate.
 * Authorizes one exact Mission 110 readiness result. Performs no writes.
 */

function authorizationError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function assertReplacementReadiness(readiness) {
  if (
    !readiness ||
    readiness.kind !== 'existing-slot-calendar-replacement-readiness' ||
    readiness.version !== 1 ||
    readiness.ready !== true ||
    readiness.replacementAuthorized !== false ||
    readiness.replacementPerformed !== false ||
    typeof readiness.candidateSlotId !== 'string' ||
    !readiness.candidateSlotId ||
    typeof readiness.targetSlotId !== 'string' ||
    !readiness.targetSlotId ||
    readiness.candidateSlotId === readiness.targetSlotId ||
    typeof readiness.storageKey !== 'string' ||
    !readiness.storageKey ||
    !readiness.reloadVerification ||
    readiness.reloadVerification.slotId !== readiness.candidateSlotId ||
    !readiness.checkpoint ||
    readiness.checkpoint.slotId !== readiness.targetSlotId ||
    readiness.checkpoint.storageKey !== readiness.storageKey ||
    readiness.fromDate !== readiness.reloadVerification.fromDate ||
    readiness.toDate !== readiness.reloadVerification.toDate ||
    readiness.requirements?.explicitReplacementAuthorizationRequired !== true ||
    readiness.requirements?.verifyAfterReplacementRequired !== true ||
    readiness.requirements?.restoreCheckpointOnFailureRequired !== true
  ) {
    throw authorizationError(
      'INVALID_CALENDAR_REPLACEMENT_AUTHORIZATION',
      'A valid existing-slot calendar replacement readiness result is required.'
    );
  }
  return readiness;
}

function createExistingSlotCalendarReplacementAuthorization(input = {}) {
  const readiness = assertReplacementReadiness(input.readiness);
  if (input.approved !== true) {
    throw authorizationError(
      'CALENDAR_REPLACEMENT_NOT_APPROVED',
      'Existing-slot calendar replacement requires explicit approval.'
    );
  }

  return Object.freeze({
    kind: 'existing-slot-calendar-replacement-authorization',
    version: 1,
    approved: true,
    candidateSlotId: readiness.candidateSlotId,
    targetSlotId: readiness.targetSlotId,
    storageKey: readiness.storageKey,
    fromDate: readiness.fromDate,
    toDate: readiness.toDate,
    readiness,
    reloadVerification: readiness.reloadVerification,
    checkpoint: readiness.checkpoint,
    candidateState: readiness.reloadVerification.state
  });
}

function assertExistingSlotCalendarReplacementAuthorized(readiness, authorization) {
  const validated = assertReplacementReadiness(readiness);
  if (
    !authorization ||
    authorization.kind !== 'existing-slot-calendar-replacement-authorization' ||
    authorization.version !== 1 ||
    authorization.approved !== true ||
    authorization.readiness !== validated ||
    authorization.reloadVerification !== validated.reloadVerification ||
    authorization.checkpoint !== validated.checkpoint ||
    authorization.candidateState !== validated.reloadVerification.state ||
    authorization.candidateSlotId !== validated.candidateSlotId ||
    authorization.targetSlotId !== validated.targetSlotId ||
    authorization.storageKey !== validated.storageKey ||
    authorization.fromDate !== validated.fromDate ||
    authorization.toDate !== validated.toDate
  ) {
    throw authorizationError(
      'CALENDAR_REPLACEMENT_AUTHORIZATION_MISMATCH',
      'Replacement authorization does not match the exact readiness result.'
    );
  }
  return true;
}

module.exports = {
  createExistingSlotCalendarReplacementAuthorization,
  assertExistingSlotCalendarReplacementAuthorized
};
