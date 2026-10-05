'use strict';
const assert = require('assert');
const { createGameStateEnvelope } = require('./hlm-game-state');
const { createBrowserSaveAdapter } = require('./hlm-browser-save-adapter');
const { executeCalendarRecoveryCheckpointRetirement } = require('./hlm-calendar-recovery-checkpoint-retirement-execution');

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
const authorization = Object.freeze({
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
  completion,
  verification,
  checkpoint,
  state
});

const store = storage();
const repository = createBrowserSaveAdapter(store);
repository.save('franchise', state, { saveId: 'franchise' });

const before = store.getItem(repository.storageKey);
const result = executeCalendarRecoveryCheckpointRetirement({ readiness, authorization, repository });
assert.strictEqual(result.kind, 'calendar-recovery-checkpoint-retirement-execution');
assert.strictEqual(result.executed, true);
assert.strictEqual(result.verified, true);
assert.strictEqual(result.checkpointRetired, true);
assert.strictEqual(result.rollbackAuthorityRetired, true);
assert.strictEqual(result.storageDeleted, false);
assert.strictEqual(result.durableTargetPreserved, true);
assert.strictEqual(result.stagingSlotAbsent, true);
assert.strictEqual(result.retiredCheckpoint, checkpoint);
assert.strictEqual(Object.isFrozen(result), true);
assert.strictEqual(store.getItem(repository.storageKey), before);
assert.strictEqual(repository.has('franchise'), true);

assert.throws(
  () => executeCalendarRecoveryCheckpointRetirement({
    readiness: { ...readiness },
    authorization,
    repository
  }),
  error => error.code === 'CALENDAR_RECOVERY_CHECKPOINT_RETIREMENT_EXECUTION_FAILED'
);

repository.save('calendar-staging', state, { saveId: 'calendar-staging' });
assert.throws(
  () => executeCalendarRecoveryCheckpointRetirement({ readiness, authorization, repository }),
  error => error.code === 'CALENDAR_RECOVERY_CHECKPOINT_RETIREMENT_EXECUTION_FAILED'
);
repository.remove('calendar-staging');

const tampered = createGameStateEnvelope({ meta: { currentDate: '2027-03-06' } });
repository.save('franchise', tampered, { saveId: 'franchise' }, { replace: true });
assert.throws(
  () => executeCalendarRecoveryCheckpointRetirement({ readiness, authorization, repository }),
  error => error.code === 'CALENDAR_RECOVERY_CHECKPOINT_RETIREMENT_EXECUTION_FAILED'
);

console.log('Calendar recovery checkpoint retirement execution tests passed.');
