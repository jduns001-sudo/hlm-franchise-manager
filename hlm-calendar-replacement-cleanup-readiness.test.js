'use strict';
const assert = require('assert');
const { DEFAULT_STORAGE_KEY, createBrowserSaveAdapter } = require('./hlm-browser-save-adapter');
const { createGameStateEnvelope } = require('./hlm-game-state');
const { createCalendarPersistenceRecoveryCheckpoint } = require('./hlm-calendar-persistence-recovery-checkpoint');
const { createExistingSlotCalendarReplacementAuthorization } = require('./hlm-calendar-replacement-authorization');
const { executeExistingSlotCalendarReplacement } = require('./hlm-calendar-replacement-executor');
const { verifyExistingSlotCalendarReplacement } = require('./hlm-calendar-replacement-verification');
const { completeCalendarReplacementTransaction } = require('./hlm-calendar-replacement-transaction-completion');
const { evaluateCalendarReplacementCleanupReadiness } = require('./hlm-calendar-replacement-cleanup-readiness');

function memoryStorage() {
  const data = new Map();
  return {
    getItem: key => data.has(key) ? data.get(key) : null,
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: key => data.delete(key)
  };
}

function build() {
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
    slotId: 'calendar-staging', fromDate: '2027-03-03', toDate: '2027-03-05', state: candidateState
  });
  const readiness = Object.freeze({
    kind: 'existing-slot-calendar-replacement-readiness', version: 1, ready: true,
    replacementAuthorized: false, replacementPerformed: false,
    candidateSlotId: 'calendar-staging', targetSlotId: 'franchise',
    storageKey: DEFAULT_STORAGE_KEY, fromDate: '2027-03-03', toDate: '2027-03-05',
    reloadVerification, checkpoint,
    requirements: Object.freeze({
      explicitReplacementAuthorizationRequired: true,
      verifyAfterReplacementRequired: true,
      restoreCheckpointOnFailureRequired: true
    })
  });
  const authorization = createExistingSlotCalendarReplacementAuthorization({ readiness, approved: true });
  const execution = executeExistingSlotCalendarReplacement({ readiness, authorization, repository, storage });
  const verification = verifyExistingSlotCalendarReplacement({ execution, repository });
  const completion = completeCalendarReplacementTransaction({ verification });
  return { storage, repository, oldState, candidateState, completion };
}

{
  const f = build();
  const result = evaluateCalendarReplacementCleanupReadiness(f);
  assert.strictEqual(result.kind, 'calendar-replacement-cleanup-readiness');
  assert.strictEqual(result.ready, true);
  assert.strictEqual(result.cleanupAuthorized, false);
  assert.strictEqual(result.cleanupPerformed, false);
  assert.strictEqual(result.candidateSlotId, 'calendar-staging');
  assert.strictEqual(result.targetSlotId, 'franchise');
  assert.strictEqual(result.completion, f.completion);
  assert.strictEqual(result.checkpoint, f.completion.checkpoint);
  assert.strictEqual(result.requirements.explicitCleanupAuthorizationRequired, true);
  assert.strictEqual(Object.isFrozen(result), true);
  assert.strictEqual(Object.isFrozen(result.requirements), true);
  assert.strictEqual(f.repository.has('calendar-staging'), true);
  assert.strictEqual(f.repository.has('franchise'), true);
}

{
  const f = build();
  f.repository.remove('calendar-staging');
  assert.throws(
    () => evaluateCalendarReplacementCleanupReadiness(f),
    error => error.code === 'CALENDAR_REPLACEMENT_CLEANUP_NOT_READY'
  );
}

{
  const f = build();
  f.repository.save('franchise', createGameStateEnvelope({
    meta: { currentDate: '2027-03-05' }, extensions: { tampered: true }
  }), { saveId: 'franchise' }, { replace: true });
  assert.throws(
    () => evaluateCalendarReplacementCleanupReadiness(f),
    error => error.code === 'CALENDAR_REPLACEMENT_CLEANUP_NOT_READY'
  );
}

{
  const f = build();
  assert.throws(
    () => evaluateCalendarReplacementCleanupReadiness({
      ...f, completion: { ...f.completion, cleanupPerformed: true }
    }),
    error => error.code === 'CALENDAR_REPLACEMENT_CLEANUP_NOT_READY'
  );
}

console.log('Calendar replacement cleanup readiness tests passed.');
