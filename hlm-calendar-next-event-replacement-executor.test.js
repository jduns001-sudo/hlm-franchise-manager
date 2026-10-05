'use strict';
const assert = require('assert');
const { DEFAULT_STORAGE_KEY, createBrowserSaveAdapter } = require('./hlm-browser-save-adapter');
const { createGameStateEnvelope } = require('./hlm-game-state');
const { serializeGameState } = require('./hlm-game-state-serialization');
const { createNextEventCalendarPersistenceRecoveryCheckpoint } = require('./hlm-calendar-next-event-persistence-recovery-checkpoint');
const { createExistingSlotNextEventCalendarReplacementAuthorization } = require('./hlm-calendar-next-event-replacement-authorization');
const { executeExistingSlotNextEventCalendarReplacement } = require('./hlm-calendar-next-event-replacement-executor');

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
  const oldState = createGameStateEnvelope({ meta: { currentDate: '2027-03-03', controlledTeamId: 'PIT' } });
  const candidateState = createGameStateEnvelope({ meta: { currentDate: '2027-03-05', controlledTeamId: 'PIT' } });
  const targetEvent = Object.freeze({ id: 'game-1', type: 'game', date: '2027-03-05', important: true });
  repository.save('franchise', oldState, { saveId: 'franchise' });
  repository.save('next-event-staging', candidateState, { saveId: 'next-event-staging' });
  const checkpoint = createNextEventCalendarPersistenceRecoveryCheckpoint({
    storage, storageKey: DEFAULT_STORAGE_KEY, slotId: 'franchise'
  });
  const reloadVerification = Object.freeze({
    slotId: 'next-event-staging', fromDate: '2027-03-03', toDate: '2027-03-05',
    targetEvent, state: candidateState
  });
  const readiness = Object.freeze({
    kind: 'existing-slot-next-event-calendar-replacement-readiness', version: 1,
    ready: true, replacementAuthorized: false, replacementPerformed: false,
    candidateSlotId: 'next-event-staging', targetSlotId: 'franchise',
    storageKey: DEFAULT_STORAGE_KEY, fromDate: '2027-03-03', toDate: '2027-03-05',
    targetEvent, reloadVerification, checkpoint,
    requirements: Object.freeze({
      explicitReplacementAuthorizationRequired: true,
      verifyAfterReplacementRequired: true,
      restoreCheckpointOnFailureRequired: true
    })
  });
  const authorization = createExistingSlotNextEventCalendarReplacementAuthorization({ readiness, approved: true });
  return { storage, repository, oldState, candidateState, targetEvent, checkpoint, readiness, authorization };
}

{
  const f = fixture();
  const result = executeExistingSlotNextEventCalendarReplacement(f);
  assert.strictEqual(result.kind, 'existing-slot-next-event-calendar-replacement-execution');
  assert.strictEqual(result.executed, true);
  assert.strictEqual(result.verified, true);
  assert.strictEqual(result.rolledBack, false);
  assert.strictEqual(result.targetEvent, f.targetEvent);
  assert.strictEqual(result.authorization, f.authorization);
  assert.strictEqual(Object.isFrozen(result), true);
  assert.strictEqual(serializeGameState(f.repository.load('franchise').state), serializeGameState(f.candidateState));
  assert.strictEqual(f.repository.has('next-event-staging'), true);
}

{
  const f = fixture();
  const before = f.storage.getItem(DEFAULT_STORAGE_KEY);
  const failingRepository = {
    storageKey: DEFAULT_STORAGE_KEY,
    has: id => f.repository.has(id),
    save: (...args) => f.repository.save(...args),
    load: id => id === 'franchise'
      ? { state: createGameStateEnvelope({ meta: { currentDate: '2027-03-04', controlledTeamId: 'PIT' } }) }
      : f.repository.load(id)
  };
  let thrown;
  try { executeExistingSlotNextEventCalendarReplacement({ ...f, repository: failingRepository }); }
  catch (error) { thrown = error; }
  assert(thrown);
  assert.strictEqual(thrown.code, 'NEXT_EVENT_CALENDAR_REPLACEMENT_POST_WRITE_VERIFICATION_FAILED');
  assert.strictEqual(thrown.persistenceRolledBack, true);
  assert.strictEqual(f.storage.getItem(DEFAULT_STORAGE_KEY), before);
  assert.strictEqual(serializeGameState(f.repository.load('franchise').state), serializeGameState(f.oldState));
  assert.strictEqual(f.repository.has('next-event-staging'), true);
}

{
  const f = fixture();
  assert.throws(() => executeExistingSlotNextEventCalendarReplacement({
    ...f, authorization: { ...f.authorization, targetEvent: { ...f.targetEvent } }
  }), e => e.code === 'NEXT_EVENT_CALENDAR_REPLACEMENT_EXECUTION_NOT_AUTHORIZED');
}
{
  const f = fixture();
  assert.throws(() => executeExistingSlotNextEventCalendarReplacement({
    ...f, repository: { ...f.repository, storageKey: 'wrong-key' }
  }), e => e.code === 'NEXT_EVENT_CALENDAR_REPLACEMENT_STORAGE_MISMATCH');
}

console.log('Existing-slot next-event calendar replacement executor tests passed.');
