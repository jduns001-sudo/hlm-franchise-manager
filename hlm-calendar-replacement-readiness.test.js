'use strict';
const assert = require('assert');
const { DEFAULT_STORAGE_KEY, createBrowserSaveAdapter } = require('./hlm-browser-save-adapter');
const { createGameStateEnvelope } = require('./hlm-game-state');
const { createCalendarPersistenceRecoveryCheckpoint } = require('./hlm-calendar-persistence-recovery-checkpoint');
const { evaluateExistingSlotCalendarReplacementReadiness } = require('./hlm-calendar-replacement-readiness');

function memoryStorage() {
  const data = new Map();
  return {
    getItem: key => data.has(key) ? data.get(key) : null,
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: key => data.delete(key)
  };
}

const storage = memoryStorage();
const repository = createBrowserSaveAdapter(storage);
const oldState = createGameStateEnvelope({ meta: { currentDate: '2027-03-03' } });
const candidateState = createGameStateEnvelope({ meta: { currentDate: '2027-03-05' } });
repository.save('franchise', oldState, { saveId: 'franchise' });
repository.save('calendar-staging', candidateState, { saveId: 'calendar-staging' });

const checkpoint = createCalendarPersistenceRecoveryCheckpoint({
  storage, storageKey: DEFAULT_STORAGE_KEY, slotId: 'franchise'
});
const reloadVerification = Object.freeze({
  kind: 'persisted-calendar-gamestate-reload-verification',
  version: 1,
  verified: true,
  slotId: 'calendar-staging',
  fromDate: '2027-03-03',
  toDate: '2027-03-05',
  verification: Object.freeze({ kind: 'calendar-persistence-execution-verification' }),
  state: candidateState
});

const readiness = evaluateExistingSlotCalendarReplacementReadiness({
  reloadVerification, checkpoint, repository,
  targetSlotId: 'franchise', storageKey: DEFAULT_STORAGE_KEY
});

assert.strictEqual(readiness.kind, 'existing-slot-calendar-replacement-readiness');
assert.strictEqual(readiness.ready, true);
assert.strictEqual(readiness.replacementAuthorized, false);
assert.strictEqual(readiness.replacementPerformed, false);
assert.strictEqual(readiness.candidateSlotId, 'calendar-staging');
assert.strictEqual(readiness.targetSlotId, 'franchise');
assert.strictEqual(readiness.storageKey, DEFAULT_STORAGE_KEY);
assert.strictEqual(readiness.fromDate, '2027-03-03');
assert.strictEqual(readiness.toDate, '2027-03-05');
assert.strictEqual(readiness.reloadVerification, reloadVerification);
assert.strictEqual(readiness.checkpoint, checkpoint);
assert.strictEqual(readiness.requirements.explicitReplacementAuthorizationRequired, true);
assert.strictEqual(readiness.requirements.verifyAfterReplacementRequired, true);
assert.strictEqual(readiness.requirements.restoreCheckpointOnFailureRequired, true);
assert.strictEqual(Object.isFrozen(readiness), true);
assert.strictEqual(Object.isFrozen(readiness.requirements), true);

assert.throws(
  () => evaluateExistingSlotCalendarReplacementReadiness({
    reloadVerification, checkpoint: { ...checkpoint, slotId: 'other' }, repository,
    targetSlotId: 'franchise', storageKey: DEFAULT_STORAGE_KEY
  }),
  error => error.code === 'CALENDAR_REPLACEMENT_NOT_READY'
);

assert.throws(
  () => evaluateExistingSlotCalendarReplacementReadiness({
    reloadVerification, checkpoint, repository,
    targetSlotId: 'calendar-staging', storageKey: DEFAULT_STORAGE_KEY
  }),
  error => error.code === 'CALENDAR_REPLACEMENT_NOT_READY'
);

const emptyRepository = { has: () => false };
assert.throws(
  () => evaluateExistingSlotCalendarReplacementReadiness({
    reloadVerification, checkpoint, repository: emptyRepository,
    targetSlotId: 'franchise', storageKey: DEFAULT_STORAGE_KEY
  }),
  error => error.code === 'CALENDAR_REPLACEMENT_NOT_READY'
);

assert.throws(
  () => evaluateExistingSlotCalendarReplacementReadiness({
    reloadVerification, checkpoint: { ...checkpoint, saveStoreValue: null }, repository,
    targetSlotId: 'franchise', storageKey: DEFAULT_STORAGE_KEY
  }),
  error => error.code === 'CALENDAR_REPLACEMENT_NOT_READY'
);

console.log('Existing-slot calendar replacement readiness tests passed.');
