'use strict';
const assert = require('assert');
const {
  createExistingSlotNextEventCalendarReplacementAuthorization,
  assertExistingSlotNextEventCalendarReplacementAuthorized
} = require('./hlm-calendar-next-event-replacement-authorization');

const targetEvent = Object.freeze({ id: 'game-1', date: '2027-03-05' });
const candidateState = Object.freeze({ marker: 'candidate' });
const reloadVerification = Object.freeze({
  slotId: 'next-event-staging', fromDate: '2027-03-03', toDate: '2027-03-05',
  targetEvent, state: candidateState
});
const checkpoint = Object.freeze({ slotId: 'franchise', storageKey: 'hfm_game_state_saves_v1' });
const requirements = Object.freeze({
  explicitReplacementAuthorizationRequired: true,
  verifyAfterReplacementRequired: true,
  restoreCheckpointOnFailureRequired: true
});
const readiness = Object.freeze({
  kind: 'existing-slot-next-event-calendar-replacement-readiness',
  version: 1, ready: true, replacementAuthorized: false, replacementPerformed: false,
  candidateSlotId: 'next-event-staging', targetSlotId: 'franchise',
  storageKey: 'hfm_game_state_saves_v1', fromDate: '2027-03-03', toDate: '2027-03-05',
  targetEvent, reloadVerification, checkpoint, requirements
});

const authorization = createExistingSlotNextEventCalendarReplacementAuthorization({ readiness, approved: true });
assert.strictEqual(authorization.kind, 'existing-slot-next-event-calendar-replacement-authorization');
assert.strictEqual(authorization.version, 1);
assert.strictEqual(authorization.approved, true);
assert.strictEqual(authorization.targetEvent, targetEvent);
assert.strictEqual(authorization.readiness, readiness);
assert.strictEqual(authorization.reloadVerification, reloadVerification);
assert.strictEqual(authorization.checkpoint, checkpoint);
assert.strictEqual(authorization.candidateState, candidateState);
assert.strictEqual(Object.isFrozen(authorization), true);
assert.strictEqual(assertExistingSlotNextEventCalendarReplacementAuthorized(readiness, authorization), true);

assert.throws(() => createExistingSlotNextEventCalendarReplacementAuthorization({ readiness, approved: false }),
  e => e.code === 'NEXT_EVENT_CALENDAR_REPLACEMENT_NOT_APPROVED');
assert.throws(() => createExistingSlotNextEventCalendarReplacementAuthorization({
  readiness: { ...readiness, targetEvent: { ...targetEvent } }, approved: true
}), e => e.code === 'INVALID_NEXT_EVENT_CALENDAR_REPLACEMENT_AUTHORIZATION');
assert.throws(() => assertExistingSlotNextEventCalendarReplacementAuthorized(readiness, {
  ...authorization, readiness: { ...readiness }
}), e => e.code === 'NEXT_EVENT_CALENDAR_REPLACEMENT_AUTHORIZATION_MISMATCH');
assert.throws(() => assertExistingSlotNextEventCalendarReplacementAuthorized(readiness, {
  ...authorization, targetSlotId: 'other'
}), e => e.code === 'NEXT_EVENT_CALENDAR_REPLACEMENT_AUTHORIZATION_MISMATCH');

console.log('Existing-slot next-event calendar replacement authorization tests passed.');
