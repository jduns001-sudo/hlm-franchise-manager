'use strict';
const assert = require('assert');
const { createGameStateEnvelope } = require('./hlm-game-state');
const { createBrowserSaveAdapter } = require('./hlm-browser-save-adapter');
const { verifyCalendarRecoveryCheckpointRetirement } = require('./hlm-calendar-recovery-checkpoint-retirement-verification');

function storage() {
  const values = new Map();
  return {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key)
  };
}

const state = createGameStateEnvelope({ meta: { currentDate: '2027-03-05' } });
const checkpoint = Object.freeze({ marker: 'checkpoint' });
const cleanupVerification = Object.freeze({ marker: 'cleanup-verification' });
const completion = Object.freeze({ marker: 'completion' });
const readiness = Object.freeze({
  kind: 'calendar-recovery-checkpoint-retirement-readiness',
  version: 1,
  ready: true,
  checkpointStillPreserved: true,
  completion,
  verification: cleanupVerification,
  checkpoint,
  state
});
const authorization = Object.freeze({
  kind: 'calendar-recovery-checkpoint-retirement-authorization',
  version: 1,
  approved: true,
  executed: false,
  readiness,
  completion,
  verification: cleanupVerification,
  checkpoint,
  state,
  candidateSlotId: 'calendar-staging',
  targetSlotId: 'franchise',
  storageKey: 'hfm_game_state_saves_v1',
  fromDate: '2027-03-03',
  toDate: '2027-03-05'
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
  candidateSlotId: authorization.candidateSlotId,
  targetSlotId: authorization.targetSlotId,
  storageKey: authorization.storageKey,
  fromDate: authorization.fromDate,
  toDate: authorization.toDate,
  readiness,
  authorization,
  completion,
  verification: cleanupVerification,
  retiredCheckpoint: checkpoint,
  state
});

const store = storage();
const repository = createBrowserSaveAdapter(store);
repository.save('franchise', state, { saveId: 'franchise' });
const before = store.getItem(repository.storageKey);

const result = verifyCalendarRecoveryCheckpointRetirement({ execution, repository });
assert.strictEqual(result.kind, 'calendar-recovery-checkpoint-retirement-verification');
assert.strictEqual(result.verified, true);
assert.strictEqual(result.checkpointRetirementVerified, true);
assert.strictEqual(result.rollbackAuthorityRetired, true);
assert.strictEqual(result.storagePreserved, true);
assert.strictEqual(result.durableTargetPreserved, true);
assert.strictEqual(result.stagingSlotAbsent, true);
assert.strictEqual(result.lineageIntact, true);
assert.strictEqual(result.execution, execution);
assert.strictEqual(result.retiredCheckpoint, checkpoint);
assert.strictEqual(Object.isFrozen(result), true);
assert.strictEqual(store.getItem(repository.storageKey), before);

assert.throws(
  () => verifyCalendarRecoveryCheckpointRetirement({
    execution: { ...execution, authorization: { ...authorization, readiness: { ...readiness } } },
    repository
  }),
  error => error.code === 'CALENDAR_RECOVERY_CHECKPOINT_RETIREMENT_VERIFICATION_FAILED'
);

repository.save('calendar-staging', state, { saveId: 'calendar-staging' });
assert.throws(
  () => verifyCalendarRecoveryCheckpointRetirement({ execution, repository }),
  error => error.code === 'CALENDAR_RECOVERY_CHECKPOINT_RETIREMENT_VERIFICATION_FAILED'
);
repository.remove('calendar-staging');

repository.remove('franchise');
assert.throws(
  () => verifyCalendarRecoveryCheckpointRetirement({ execution, repository }),
  error => error.code === 'CALENDAR_RECOVERY_CHECKPOINT_RETIREMENT_VERIFICATION_FAILED'
);

console.log('Calendar recovery checkpoint retirement verification tests passed.');
