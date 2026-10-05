'use strict';
const assert = require('assert');
const {
  createCalendarRecoveryCheckpointRetirementAuthorization,
  assertCalendarRecoveryCheckpointRetirementAuthorized
} = require('./hlm-calendar-recovery-checkpoint-retirement-authorization');

const state = Object.freeze({ meta: Object.freeze({ currentDate: '2027-03-05' }) });
const checkpoint = Object.freeze({ marker: 'checkpoint' });
const verification = Object.freeze({ marker: 'verification' });
const completion = Object.freeze({
  candidateSlotId: 'calendar-staging',
  targetSlotId: 'franchise',
  storageKey: 'hfm_game_state_saves_v1',
  fromDate: '2027-03-03',
  toDate: '2027-03-05',
  verification,
  checkpoint,
  state
});
const readiness = Object.freeze({
  kind: 'calendar-recovery-checkpoint-retirement-readiness',
  version: 1,
  ready: true,
  retirementAuthorized: false,
  retirementPerformed: false,
  checkpointStillPreserved: true,
  candidateSlotId: 'calendar-staging',
  targetSlotId: 'franchise',
  storageKey: 'hfm_game_state_saves_v1',
  fromDate: '2027-03-03',
  toDate: '2027-03-05',
  completion,
  verification,
  checkpoint,
  state,
  requirements: Object.freeze({
    explicitRetirementAuthorizationRequired: true,
    durableTargetMustRemainVerified: true
  })
});

const authorization = createCalendarRecoveryCheckpointRetirementAuthorization({
  readiness,
  approved: true
});
assert.strictEqual(authorization.kind, 'calendar-recovery-checkpoint-retirement-authorization');
assert.strictEqual(authorization.version, 1);
assert.strictEqual(authorization.approved, true);
assert.strictEqual(authorization.executed, false);
assert.strictEqual(authorization.checkpointMustRemainPreservedUntilExecution, true);
assert.strictEqual(authorization.durableTargetMustRemainVerified, true);
assert.strictEqual(authorization.readiness, readiness);
assert.strictEqual(authorization.checkpoint, checkpoint);
assert.strictEqual(authorization.state, state);
assert.strictEqual(Object.isFrozen(authorization), true);
assert.strictEqual(assertCalendarRecoveryCheckpointRetirementAuthorized(readiness, authorization), true);

assert.throws(
  () => createCalendarRecoveryCheckpointRetirementAuthorization({ readiness, approved: false }),
  error => error.code === 'CALENDAR_RECOVERY_CHECKPOINT_RETIREMENT_NOT_AUTHORIZED'
);

assert.throws(
  () => createCalendarRecoveryCheckpointRetirementAuthorization({
    readiness: { ...readiness, checkpointStillPreserved: false },
    approved: true
  }),
  error => error.code === 'CALENDAR_RECOVERY_CHECKPOINT_RETIREMENT_NOT_AUTHORIZED'
);

assert.throws(
  () => assertCalendarRecoveryCheckpointRetirementAuthorized(
    { ...readiness },
    authorization
  ),
  error => error.code === 'CALENDAR_RECOVERY_CHECKPOINT_RETIREMENT_NOT_AUTHORIZED'
);

assert.throws(
  () => assertCalendarRecoveryCheckpointRetirementAuthorized(
    readiness,
    { ...authorization, checkpoint: { ...checkpoint } }
  ),
  error => error.code === 'CALENDAR_RECOVERY_CHECKPOINT_RETIREMENT_NOT_AUTHORIZED'
);

console.log('Calendar recovery checkpoint retirement authorization tests passed.');
