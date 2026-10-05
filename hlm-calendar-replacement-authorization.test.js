'use strict';
const assert = require('assert');
const {
  createExistingSlotCalendarReplacementAuthorization,
  assertExistingSlotCalendarReplacementAuthorized
} = require('./hlm-calendar-replacement-authorization');

const candidateState = Object.freeze({ marker: 'candidate' });
const reloadVerification = Object.freeze({
  slotId: 'calendar-staging',
  fromDate: '2027-03-03',
  toDate: '2027-03-05',
  state: candidateState
});
const checkpoint = Object.freeze({
  slotId: 'franchise',
  storageKey: 'hfm_game_state_saves_v1'
});
const requirements = Object.freeze({
  explicitReplacementAuthorizationRequired: true,
  verifyAfterReplacementRequired: true,
  restoreCheckpointOnFailureRequired: true
});
const readiness = Object.freeze({
  kind: 'existing-slot-calendar-replacement-readiness',
  version: 1,
  ready: true,
  replacementAuthorized: false,
  replacementPerformed: false,
  candidateSlotId: 'calendar-staging',
  targetSlotId: 'franchise',
  storageKey: 'hfm_game_state_saves_v1',
  fromDate: '2027-03-03',
  toDate: '2027-03-05',
  reloadVerification,
  checkpoint,
  requirements
});

const authorization = createExistingSlotCalendarReplacementAuthorization({
  readiness, approved: true
});

assert.strictEqual(authorization.kind, 'existing-slot-calendar-replacement-authorization');
assert.strictEqual(authorization.version, 1);
assert.strictEqual(authorization.approved, true);
assert.strictEqual(authorization.candidateSlotId, 'calendar-staging');
assert.strictEqual(authorization.targetSlotId, 'franchise');
assert.strictEqual(authorization.storageKey, 'hfm_game_state_saves_v1');
assert.strictEqual(authorization.fromDate, '2027-03-03');
assert.strictEqual(authorization.toDate, '2027-03-05');
assert.strictEqual(authorization.readiness, readiness);
assert.strictEqual(authorization.reloadVerification, reloadVerification);
assert.strictEqual(authorization.checkpoint, checkpoint);
assert.strictEqual(authorization.candidateState, candidateState);
assert.strictEqual(Object.isFrozen(authorization), true);
assert.strictEqual(assertExistingSlotCalendarReplacementAuthorized(readiness, authorization), true);

assert.throws(
  () => createExistingSlotCalendarReplacementAuthorization({ readiness, approved: false }),
  error => error.code === 'CALENDAR_REPLACEMENT_NOT_APPROVED'
);

assert.throws(
  () => createExistingSlotCalendarReplacementAuthorization({
    readiness: { ...readiness, targetSlotId: 'calendar-staging' }, approved: true
  }),
  error => error.code === 'INVALID_CALENDAR_REPLACEMENT_AUTHORIZATION'
);

assert.throws(
  () => assertExistingSlotCalendarReplacementAuthorized(readiness, {
    ...authorization, readiness: { ...readiness }
  }),
  error => error.code === 'CALENDAR_REPLACEMENT_AUTHORIZATION_MISMATCH'
);

assert.throws(
  () => assertExistingSlotCalendarReplacementAuthorized(readiness, {
    ...authorization, targetSlotId: 'other'
  }),
  error => error.code === 'CALENDAR_REPLACEMENT_AUTHORIZATION_MISMATCH'
);

console.log('Existing-slot calendar replacement authorization tests passed.');
