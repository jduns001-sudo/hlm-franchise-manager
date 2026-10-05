'use strict';
const assert = require('assert');
const { DEFAULT_STORAGE_KEY, createBrowserSaveAdapter } = require('./hlm-browser-save-adapter');
const { createGameStateEnvelope } = require('./hlm-game-state');
const { createCalendarPersistenceRecoveryCheckpoint } = require('./hlm-calendar-persistence-recovery-checkpoint');
const { createExistingSlotCalendarReplacementAuthorization } = require('./hlm-calendar-replacement-authorization');
const { executeExistingSlotCalendarReplacement } = require('./hlm-calendar-replacement-executor');
const { verifyExistingSlotCalendarReplacement } = require('./hlm-calendar-replacement-verification');

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
  const execution = executeExistingSlotCalendarReplacement({
    readiness, authorization, repository, storage
  });
  return { storage, repository, candidateState, execution };
}

{
  const f = build();
  const verification = verifyExistingSlotCalendarReplacement(f);
  assert.strictEqual(verification.kind, 'existing-slot-calendar-replacement-verification');
  assert.strictEqual(verification.version, 1);
  assert.strictEqual(verification.verified, true);
  assert.strictEqual(verification.candidateSlotId, 'calendar-staging');
  assert.strictEqual(verification.targetSlotId, 'franchise');
  assert.strictEqual(verification.storageKey, DEFAULT_STORAGE_KEY);
  assert.strictEqual(verification.fromDate, '2027-03-03');
  assert.strictEqual(verification.toDate, '2027-03-05');
  assert.strictEqual(verification.execution, f.execution);
  assert.strictEqual(verification.authorization, f.execution.authorization);
  assert.strictEqual(verification.checkpoint, f.execution.checkpoint);
  assert.notStrictEqual(verification.state, f.candidateState);
  assert.strictEqual(Object.isFrozen(verification), true);
}

{
  const f = build();
  const tampered = createGameStateEnvelope({
    meta: { currentDate: '2027-03-05' },
    extensions: { tampered: true }
  });
  f.repository.save('franchise', tampered, { saveId: 'franchise' }, { replace: true });
  assert.throws(
    () => verifyExistingSlotCalendarReplacement(f),
    error => error.code === 'CALENDAR_REPLACEMENT_VERIFICATION_FAILED'
  );
}

{
  const f = build();
  assert.throws(
    () => verifyExistingSlotCalendarReplacement({
      ...f, execution: { ...f.execution, verified: false }
    }),
    error => error.code === 'CALENDAR_REPLACEMENT_VERIFICATION_FAILED'
  );
}

{
  const f = build();
  const wrongRepository = { ...f.repository, storageKey: 'wrong-key' };
  assert.throws(
    () => verifyExistingSlotCalendarReplacement({ ...f, repository: wrongRepository }),
    error => error.code === 'CALENDAR_REPLACEMENT_VERIFICATION_FAILED'
  );
}

console.log('Existing-slot calendar replacement verification tests passed.');
