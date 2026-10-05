'use strict';
const assert = require('assert');
const { createGameStateEnvelope } = require('./hlm-game-state');
const { evaluateCalendarRecoveryCheckpointRetirementReadiness } = require('./hlm-calendar-recovery-checkpoint-retirement-readiness');

const state = createGameStateEnvelope({ meta: { currentDate: '2027-03-05' } });
const checkpoint = Object.freeze({ marker: 'checkpoint' });
const execution = Object.freeze({ marker: 'cleanup-execution' });
const readiness = Object.freeze({ marker: 'cleanup-readiness' });
const authorization = Object.freeze({ marker: 'cleanup-authorization' });
const replacementCompletion = Object.freeze({ marker: 'replacement-completion' });
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
const completion = Object.freeze({
  kind: 'calendar-replacement-cleanup-transaction-completion',
  version: 1,
  complete: true,
  cleanupPerformed: true,
  cleanupVerified: true,
  stagingSlotRemoved: true,
  targetPreserved: true,
  checkpointPreserved: true,
  lineageIntact: true,
  candidateSlotId: 'calendar-staging',
  targetSlotId: 'franchise',
  storageKey: 'hfm_game_state_saves_v1',
  fromDate: '2027-03-03',
  toDate: '2027-03-05',
  verification,
  execution,
  readiness,
  authorization,
  replacementCompletion,
  checkpoint,
  state
});

const result = evaluateCalendarRecoveryCheckpointRetirementReadiness({ completion });
assert.strictEqual(result.kind, 'calendar-recovery-checkpoint-retirement-readiness');
assert.strictEqual(result.version, 1);
assert.strictEqual(result.ready, true);
assert.strictEqual(result.retirementAuthorized, false);
assert.strictEqual(result.retirementPerformed, false);
assert.strictEqual(result.checkpointStillPreserved, true);
assert.strictEqual(result.completion, completion);
assert.strictEqual(result.verification, verification);
assert.strictEqual(result.checkpoint, checkpoint);
assert.strictEqual(result.state, state);
assert.strictEqual(result.requirements.explicitRetirementAuthorizationRequired, true);
assert.strictEqual(result.requirements.durableTargetMustRemainVerified, true);
assert.strictEqual(Object.isFrozen(result), true);
assert.strictEqual(Object.isFrozen(result.requirements), true);

assert.throws(
  () => evaluateCalendarRecoveryCheckpointRetirementReadiness({
    completion: { ...completion, complete: false }
  }),
  error => error.code === 'CALENDAR_RECOVERY_CHECKPOINT_RETIREMENT_NOT_READY'
);

assert.throws(
  () => evaluateCalendarRecoveryCheckpointRetirementReadiness({
    completion: { ...completion, checkpointPreserved: false }
  }),
  error => error.code === 'CALENDAR_RECOVERY_CHECKPOINT_RETIREMENT_NOT_READY'
);

assert.throws(
  () => evaluateCalendarRecoveryCheckpointRetirementReadiness({
    completion: { ...completion, verification: { ...verification, execution: { ...execution } } }
  }),
  error => error.code === 'CALENDAR_RECOVERY_CHECKPOINT_RETIREMENT_NOT_READY'
);

assert.throws(
  () => evaluateCalendarRecoveryCheckpointRetirementReadiness({
    completion: { ...completion, toDate: '2027-03-06' }
  }),
  error => error.code === 'CALENDAR_RECOVERY_CHECKPOINT_RETIREMENT_NOT_READY'
);

console.log('Calendar recovery checkpoint retirement readiness tests passed.');
