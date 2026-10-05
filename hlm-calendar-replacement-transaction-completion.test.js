'use strict';
const assert = require('assert');
const { createGameStateEnvelope } = require('./hlm-game-state');
const { completeCalendarReplacementTransaction } = require('./hlm-calendar-replacement-transaction-completion');

const state = createGameStateEnvelope({ meta: { currentDate: '2027-03-05' } });
const checkpoint = Object.freeze({ marker: 'checkpoint' });
const authorization = Object.freeze({
  approved: true,
  candidateState: state
});
const execution = Object.freeze({
  kind: 'existing-slot-calendar-replacement-execution',
  version: 1,
  executed: true,
  verified: true,
  rolledBack: false,
  candidateSlotId: 'calendar-staging',
  targetSlotId: 'franchise',
  storageKey: 'hfm_game_state_saves_v1',
  fromDate: '2027-03-03',
  toDate: '2027-03-05',
  authorization,
  checkpoint,
  candidateState: state
});
const verification = Object.freeze({
  kind: 'existing-slot-calendar-replacement-verification',
  version: 1,
  verified: true,
  candidateSlotId: 'calendar-staging',
  targetSlotId: 'franchise',
  storageKey: 'hfm_game_state_saves_v1',
  fromDate: '2027-03-03',
  toDate: '2027-03-05',
  execution,
  authorization,
  checkpoint,
  state
});

const completion = completeCalendarReplacementTransaction({ verification });
assert.strictEqual(completion.kind, 'calendar-replacement-transaction-completion');
assert.strictEqual(completion.version, 1);
assert.strictEqual(completion.complete, true);
assert.strictEqual(completion.durableVerificationComplete, true);
assert.strictEqual(completion.cleanupPerformed, false);
assert.strictEqual(completion.checkpointPreserved, true);
assert.strictEqual(completion.stagingSlotPreserved, true);
assert.strictEqual(completion.candidateSlotId, 'calendar-staging');
assert.strictEqual(completion.targetSlotId, 'franchise');
assert.strictEqual(completion.fromDate, '2027-03-03');
assert.strictEqual(completion.toDate, '2027-03-05');
assert.strictEqual(completion.verification, verification);
assert.strictEqual(completion.execution, execution);
assert.strictEqual(completion.authorization, authorization);
assert.strictEqual(completion.checkpoint, checkpoint);
assert.strictEqual(completion.state, state);
assert.strictEqual(Object.isFrozen(completion), true);

assert.throws(
  () => completeCalendarReplacementTransaction({ verification: { ...verification, verified: false } }),
  error => error.code === 'CALENDAR_REPLACEMENT_TRANSACTION_NOT_COMPLETE'
);

assert.throws(
  () => completeCalendarReplacementTransaction({
    verification: { ...verification, targetSlotId: 'other' }
  }),
  error => error.code === 'CALENDAR_REPLACEMENT_TRANSACTION_NOT_COMPLETE'
);

assert.throws(
  () => completeCalendarReplacementTransaction({
    verification: { ...verification, authorization: { ...authorization } }
  }),
  error => error.code === 'CALENDAR_REPLACEMENT_TRANSACTION_NOT_COMPLETE'
);

assert.throws(
  () => completeCalendarReplacementTransaction({
    verification: { ...verification, toDate: '2027-03-06' }
  }),
  error => error.code === 'CALENDAR_REPLACEMENT_TRANSACTION_NOT_COMPLETE'
);

console.log('Calendar replacement transaction completion tests passed.');
