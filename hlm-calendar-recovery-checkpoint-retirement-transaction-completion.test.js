'use strict';
const assert = require('assert');
const { completeCalendarRecoveryCheckpointRetirementTransaction } = require('./hlm-calendar-recovery-checkpoint-retirement-transaction-completion');

const state = Object.freeze({ meta: Object.freeze({ currentDate: '2027-03-05' }) });
const checkpoint = Object.freeze({ marker: 'checkpoint' });
const cleanupCompletion = Object.freeze({ marker: 'cleanup-completion' });
const readiness = Object.freeze({
  kind: 'calendar-recovery-checkpoint-retirement-readiness',
  version: 1,
  ready: true,
  completion: cleanupCompletion,
  checkpoint,
  state
});
const authorization = Object.freeze({
  kind: 'calendar-recovery-checkpoint-retirement-authorization',
  version: 1,
  approved: true,
  executed: false,
  readiness,
  completion: cleanupCompletion,
  checkpoint
});
const execution = Object.freeze({
  kind: 'calendar-recovery-checkpoint-retirement-execution',
  version: 1,
  executed: true,
  verified: true,
  checkpointRetired: true,
  rollbackAuthorityRetired: true,
  storageDeleted: false,
  durableTargetPreserved: true,
  stagingSlotAbsent: true,
  candidateSlotId: 'calendar-staging',
  targetSlotId: 'franchise',
  storageKey: 'hfm_game_state_saves_v1',
  fromDate: '2027-03-03',
  toDate: '2027-03-05',
  readiness,
  authorization,
  completion: cleanupCompletion,
  retiredCheckpoint: checkpoint,
  state
});
const verification = Object.freeze({
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
  completion: cleanupCompletion,
  retiredCheckpoint: checkpoint,
  state
});

const result = completeCalendarRecoveryCheckpointRetirementTransaction({ verification });
assert.strictEqual(result.kind, 'calendar-recovery-checkpoint-retirement-transaction-completion');
assert.strictEqual(result.version, 1);
assert.strictEqual(result.complete, true);
assert.strictEqual(result.checkpointRetirementComplete, true);
assert.strictEqual(result.checkpointRetired, true);
assert.strictEqual(result.rollbackAuthorityRetired, true);
assert.strictEqual(result.retirementVerified, true);
assert.strictEqual(result.storagePreserved, true);
assert.strictEqual(result.durableTargetPreserved, true);
assert.strictEqual(result.stagingSlotAbsent, true);
assert.strictEqual(result.lineageIntact, true);
assert.strictEqual(result.verification, verification);
assert.strictEqual(result.execution, execution);
assert.strictEqual(result.retiredCheckpoint, checkpoint);
assert.strictEqual(Object.isFrozen(result), true);

assert.throws(
  () => completeCalendarRecoveryCheckpointRetirementTransaction({
    verification: { ...verification, verified: false }
  }),
  error => error.code === 'CALENDAR_RECOVERY_CHECKPOINT_RETIREMENT_TRANSACTION_NOT_COMPLETE'
);

assert.throws(
  () => completeCalendarRecoveryCheckpointRetirementTransaction({
    verification: { ...verification, execution: { ...execution, authorization: { ...authorization } } }
  }),
  error => error.code === 'CALENDAR_RECOVERY_CHECKPOINT_RETIREMENT_TRANSACTION_NOT_COMPLETE'
);

assert.throws(
  () => completeCalendarRecoveryCheckpointRetirementTransaction({
    verification: { ...verification, targetSlotId: 'other-slot' }
  }),
  error => error.code === 'CALENDAR_RECOVERY_CHECKPOINT_RETIREMENT_TRANSACTION_NOT_COMPLETE'
);

console.log('Calendar recovery checkpoint retirement transaction completion tests passed.');
