'use strict';
const assert = require('assert');
const { DEFAULT_STORAGE_KEY, createBrowserSaveAdapter } = require('./hlm-browser-save-adapter');
const { createGameStateEnvelope } = require('./hlm-game-state');
const { serializeGameState } = require('./hlm-game-state-serialization');
const { createCalendarPersistenceRecoveryCheckpoint } = require('./hlm-calendar-persistence-recovery-checkpoint');
const { createExistingSlotCalendarReplacementAuthorization } = require('./hlm-calendar-replacement-authorization');
const { executeExistingSlotCalendarReplacement } = require('./hlm-calendar-replacement-executor');

function memoryStorage() {
  const data = new Map();
  return {
    getItem: key => data.has(key) ? data.get(key) : null,
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: key => data.delete(key)
  };
}

function fixture() {
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
  return { storage, repository, oldState, candidateState, checkpoint, readiness, authorization };
}

{
  const f = fixture();
  const result = executeExistingSlotCalendarReplacement(f);
  assert.strictEqual(result.executed, true);
  assert.strictEqual(result.verified, true);
  assert.strictEqual(result.rolledBack, false);
  assert.strictEqual(result.targetSlotId, 'franchise');
  assert.strictEqual(result.candidateSlotId, 'calendar-staging');
  assert.strictEqual(result.authorization, f.authorization);
  assert.strictEqual(Object.isFrozen(result), true);
  assert.strictEqual(
    serializeGameState(f.repository.load('franchise').state),
    serializeGameState(f.candidateState)
  );
  assert.strictEqual(f.repository.has('calendar-staging'), true);
}

{
  const f = fixture();
  const before = f.storage.getItem(DEFAULT_STORAGE_KEY);
  const failingRepository = {
    storageKey: DEFAULT_STORAGE_KEY,
    has: id => f.repository.has(id),
    save: (...args) => f.repository.save(...args),
    load: id => {
      if (id === 'franchise') return { state: createGameStateEnvelope({ meta: { currentDate: '2027-03-04' } }) };
      return f.repository.load(id);
    }
  };
  let thrown;
  try {
    executeExistingSlotCalendarReplacement({ ...f, repository: failingRepository });
  } catch (error) {
    thrown = error;
  }
  assert(thrown);
  assert.strictEqual(thrown.code, 'CALENDAR_REPLACEMENT_POST_WRITE_VERIFICATION_FAILED');
  assert.strictEqual(thrown.persistenceRolledBack, true);
  assert.strictEqual(f.storage.getItem(DEFAULT_STORAGE_KEY), before);
  assert.strictEqual(
    serializeGameState(f.repository.load('franchise').state),
    serializeGameState(f.oldState)
  );
  assert.strictEqual(f.repository.has('calendar-staging'), true);
}

{
  const f = fixture();
  assert.throws(
    () => executeExistingSlotCalendarReplacement({
      ...f, authorization: { ...f.authorization, targetSlotId: 'other' }
    }),
    error => error.code === 'CALENDAR_REPLACEMENT_EXECUTION_NOT_AUTHORIZED'
  );
}

{
  const f = fixture();
  const wrongRepository = { ...f.repository, storageKey: 'wrong-key' };
  assert.throws(
    () => executeExistingSlotCalendarReplacement({ ...f, repository: wrongRepository }),
    error => error.code === 'CALENDAR_REPLACEMENT_STORAGE_MISMATCH'
  );
}

console.log('Existing-slot calendar replacement executor tests passed.');
