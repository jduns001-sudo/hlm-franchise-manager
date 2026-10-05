'use strict';
const assert = require('assert');
const { createGameStateEnvelope } = require('./hlm-game-state');
const { completeCalendarReplacementCleanupTransaction } = require('./hlm-calendar-replacement-cleanup-transaction-completion');

const state = createGameStateEnvelope({ meta: { currentDate: '2027-03-05' } });
const checkpoint = Object.freeze({ marker: 'checkpoint' });
const replacementCompletion = Object.freeze({
  kind: 'calendar-replacement-transaction-completion',
  complete: true
});
const readiness = Object.freeze({
  kind: 'calendar-replacement-cleanup-readiness',
  version: 1,
  ready: true,
  completion: replacementCompletion,
  checkpoint
});
const authorization = Object.freeze({
  kind: 'calendar-replacement-cleanup-authorization',
  version: 1,
  approved: true,
  readiness,
  completion: replacementCompletion,
  checkpoint
});
const execution = Object.freeze({
  kind: 'calendar-replacement-cleanup-execution',
  version: 1,
  executed: true,
  verified: true,
  stagingSlotRemoved: true,
  checkpointPreserved: true,
  candidateSlotId: 'calendar-staging',
  targetSlotId: 'franchise',
  storageKey: 'hfm_game_state_saves_v1',
  fromDate: '2027-03-03',
  toDate: '2027-03-05',
  readiness,
  authorization,
  completion: replacementCompletion,
  checkpoint
});
const verification = Object.freeze({
  kind: 'calendar-replacement-cleanup-verification',
  version: 1,
  verified: true,
  stagingSlotAbsent: true,
  targetMatchesAuthorizedCandidate: true,
  checkpointPreserved: true,
  lineageIntact: true,
  candidateSlotId: 'calendar-staging',
  targetSlotId: 'franchise',
  storageKey: 'hfm_game_state_saves_v1',
  fromDate: '2027-03-03',
  toDate: '2027-03-05',
  execution,
  readiness,
  authorization,
  completion: replacementCompletion,
  checkpoint,
  state
});

const result = completeCalendarReplacementCleanupTransaction({ verification });
assert.strictEqual(result.kind, 'calendar-replacement-cleanup-transaction-completion');
assert.strictEqual(result.version, 1);
assert.strictEqual(result.complete, true);
assert.strictEqual(result.cleanupPerformed, true);
assert.strictEqual(result.cleanupVerified, true);
assert.strictEqual(result.stagingSlotRemoved, true);
assert.strictEqual(result.targetPreserved, true);
assert.strictEqual(result.checkpointPreserved, true);
assert.strictEqual(result.lineageIntact, true);
assert.strictEqual(result.verification, verification);
assert.strictEqual(result.execution, execution);
assert.strictEqual(result.readiness, readiness);
assert.strictEqual(result.authorization, authorization);
assert.strictEqual(result.replacementCompletion, replacementCompletion);
assert.strictEqual(result.checkpoint, checkpoint);
assert.strictEqual(result.state, state);
assert.strictEqual(Object.isFrozen(result), true);

assert.throws(
  () => completeCalendarReplacementCleanupTransaction({
    verification: { ...verification, verified: false }
  }),
  error => error.code === 'CALENDAR_REPLACEMENT_CLEANUP_TRANSACTION_NOT_COMPLETE'
);

assert.throws(
  () => completeCalendarReplacementCleanupTransaction({
    verification: { ...verification, stagingSlotAbsent: false }
  }),
  error => error.code === 'CALENDAR_REPLACEMENT_CLEANUP_TRANSACTION_NOT_COMPLETE'
);

assert.throws(
  () => completeCalendarReplacementCleanupTransaction({
    verification: { ...verification, authorization: { ...authorization } }
  }),
  error => error.code === 'CALENDAR_REPLACEMENT_CLEANUP_TRANSACTION_NOT_COMPLETE'
);

assert.throws(
  () => completeCalendarReplacementCleanupTransaction({
    verification: { ...verification, targetSlotId: 'other' }
  }),
  error => error.code === 'CALENDAR_REPLACEMENT_CLEANUP_TRANSACTION_NOT_COMPLETE'
);

console.log('Calendar replacement cleanup transaction completion tests passed.');
