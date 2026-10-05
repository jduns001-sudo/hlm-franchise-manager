'use strict';

/**
 * Phase 3 Mission 121: calendar recovery checkpoint retirement authorization.
 * Explicitly authorizes one exact Mission 120 readiness object for a later,
 * separately controlled retirement execution step.
 * Performs no persistence writes, deletion, or calendar advancement.
 */

function authorizationError(message) {
  const error = new Error(message);
  error.code = 'CALENDAR_RECOVERY_CHECKPOINT_RETIREMENT_NOT_AUTHORIZED';
  return error;
}

function assertRetirementReadiness(readiness) {
  if (
    !readiness ||
    readiness.kind !== 'calendar-recovery-checkpoint-retirement-readiness' ||
    readiness.version !== 1 ||
    readiness.ready !== true ||
    readiness.retirementAuthorized !== false ||
    readiness.retirementPerformed !== false ||
    readiness.checkpointStillPreserved !== true ||
    !readiness.completion ||
    !readiness.verification ||
    !readiness.checkpoint ||
    !readiness.state ||
    readiness.requirements?.explicitRetirementAuthorizationRequired !== true ||
    readiness.requirements?.durableTargetMustRemainVerified !== true ||
    readiness.completion.verification !== readiness.verification ||
    readiness.completion.checkpoint !== readiness.checkpoint ||
    readiness.completion.state !== readiness.state ||
    readiness.candidateSlotId !== readiness.completion.candidateSlotId ||
    readiness.targetSlotId !== readiness.completion.targetSlotId ||
    readiness.storageKey !== readiness.completion.storageKey ||
    readiness.fromDate !== readiness.completion.fromDate ||
    readiness.toDate !== readiness.completion.toDate ||
    readiness.state.meta?.currentDate !== readiness.toDate
  ) {
    throw authorizationError('A valid Mission 120 checkpoint retirement readiness result is required.');
  }
}

function createCalendarRecoveryCheckpointRetirementAuthorization(input = {}) {
  const readiness = input.readiness;
  assertRetirementReadiness(readiness);

  if (input.approved !== true) {
    throw authorizationError('Explicit checkpoint retirement approval is required.');
  }

  return Object.freeze({
    kind: 'calendar-recovery-checkpoint-retirement-authorization',
    version: 1,
    approved: true,
    executed: false,
    checkpointMustRemainPreservedUntilExecution: true,
    durableTargetMustRemainVerified: true,
    candidateSlotId: readiness.candidateSlotId,
    targetSlotId: readiness.targetSlotId,
    storageKey: readiness.storageKey,
    fromDate: readiness.fromDate,
    toDate: readiness.toDate,
    readiness,
    completion: readiness.completion,
    verification: readiness.verification,
    checkpoint: readiness.checkpoint,
    state: readiness.state
  });
}

function assertCalendarRecoveryCheckpointRetirementAuthorized(readiness, authorization) {
  assertRetirementReadiness(readiness);

  if (
    !authorization ||
    authorization.kind !== 'calendar-recovery-checkpoint-retirement-authorization' ||
    authorization.version !== 1 ||
    authorization.approved !== true ||
    authorization.executed !== false ||
    authorization.checkpointMustRemainPreservedUntilExecution !== true ||
    authorization.durableTargetMustRemainVerified !== true ||
    authorization.readiness !== readiness ||
    authorization.completion !== readiness.completion ||
    authorization.verification !== readiness.verification ||
    authorization.checkpoint !== readiness.checkpoint ||
    authorization.state !== readiness.state ||
    authorization.candidateSlotId !== readiness.candidateSlotId ||
    authorization.targetSlotId !== readiness.targetSlotId ||
    authorization.storageKey !== readiness.storageKey ||
    authorization.fromDate !== readiness.fromDate ||
    authorization.toDate !== readiness.toDate
  ) {
    throw authorizationError('Authorization does not match the exact retirement readiness result.');
  }

  return true;
}

module.exports = {
  createCalendarRecoveryCheckpointRetirementAuthorization,
  assertCalendarRecoveryCheckpointRetirementAuthorized
};
