'use strict';
const assert = require('assert');
const {
  createCalendarReplacementCleanupAuthorization,
  assertCalendarReplacementCleanupAuthorized
} = require('./hlm-calendar-replacement-cleanup-authorization');

const checkpoint = Object.freeze({ marker: 'checkpoint' });
const completion = Object.freeze({
  kind: 'calendar-replacement-transaction-completion',
  complete: true,
  candidateSlotId: 'calendar-staging',
  targetSlotId: 'franchise',
  storageKey: 'hfm_game_state_saves_v1',
  fromDate: '2027-03-03',
  toDate: '2027-03-05',
  checkpoint
});
const readiness = Object.freeze({
  kind: 'calendar-replacement-cleanup-readiness',
  version: 1,
  ready: true,
  cleanupAuthorized: false,
  cleanupPerformed: false,
  candidateSlotId: 'calendar-staging',
  targetSlotId: 'franchise',
  storageKey: 'hfm_game_state_saves_v1',
  fromDate: '2027-03-03',
  toDate: '2027-03-05',
  completion,
  checkpoint,
  requirements: Object.freeze({
    explicitCleanupAuthorizationRequired: true,
    targetMustRemainDurable: true
  })
});

const authorization = createCalendarReplacementCleanupAuthorization({
  readiness,
  approved: true
});
assert.strictEqual(authorization.kind, 'calendar-replacement-cleanup-authorization');
assert.strictEqual(authorization.version, 1);
assert.strictEqual(authorization.approved, true);
assert.strictEqual(authorization.cleanupPerformed, false);
assert.strictEqual(authorization.candidateSlotId, 'calendar-staging');
assert.strictEqual(authorization.targetSlotId, 'franchise');
assert.strictEqual(authorization.readiness, readiness);
assert.strictEqual(authorization.completion, completion);
assert.strictEqual(authorization.checkpoint, checkpoint);
assert.strictEqual(Object.isFrozen(authorization), true);
assert.strictEqual(assertCalendarReplacementCleanupAuthorized(readiness, authorization), true);

assert.throws(
  () => createCalendarReplacementCleanupAuthorization({ readiness, approved: false }),
  error => error.code === 'CALENDAR_REPLACEMENT_CLEANUP_NOT_APPROVED'
);

assert.throws(
  () => createCalendarReplacementCleanupAuthorization({
    readiness: { ...readiness, cleanupPerformed: true },
    approved: true
  }),
  error => error.code === 'INVALID_CALENDAR_REPLACEMENT_CLEANUP_AUTHORIZATION'
);

assert.throws(
  () => assertCalendarReplacementCleanupAuthorized(
    readiness,
    { ...authorization, targetSlotId: 'other' }
  ),
  error => error.code === 'CALENDAR_REPLACEMENT_CLEANUP_AUTHORIZATION_MISMATCH'
);

assert.throws(
  () => assertCalendarReplacementCleanupAuthorized(
    { ...readiness },
    authorization
  ),
  error => error.code === 'CALENDAR_REPLACEMENT_CLEANUP_AUTHORIZATION_MISMATCH'
);

console.log('Calendar replacement cleanup authorization tests passed.');
