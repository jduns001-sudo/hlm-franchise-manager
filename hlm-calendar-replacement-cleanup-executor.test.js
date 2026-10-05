'use strict';
const assert = require('assert');
const { DEFAULT_STORAGE_KEY, createBrowserSaveAdapter } = require('./hlm-browser-save-adapter');
const { createGameStateEnvelope } = require('./hlm-game-state');
const { createCalendarReplacementCleanupAuthorization } = require('./hlm-calendar-replacement-cleanup-authorization');
const { executeCalendarReplacementCleanup } = require('./hlm-calendar-replacement-cleanup-executor');
const { serializeGameState } = require('./hlm-game-state-serialization');

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
  const state = createGameStateEnvelope({ meta: { currentDate: '2027-03-05' } });
  repository.save('franchise', state, { saveId: 'franchise' });
  repository.save('calendar-staging', state, { saveId: 'calendar-staging' });
  const checkpoint = Object.freeze({ marker: 'checkpoint' });
  const execution = Object.freeze({ candidateState: state });
  const completion = Object.freeze({
    kind: 'calendar-replacement-transaction-completion', complete: true,
    candidateSlotId: 'calendar-staging', targetSlotId: 'franchise',
    storageKey: DEFAULT_STORAGE_KEY, fromDate: '2027-03-03', toDate: '2027-03-05',
    checkpoint, execution
  });
  const readiness = Object.freeze({
    kind: 'calendar-replacement-cleanup-readiness', version: 1, ready: true,
    cleanupAuthorized: false, cleanupPerformed: false,
    candidateSlotId: 'calendar-staging', targetSlotId: 'franchise',
    storageKey: DEFAULT_STORAGE_KEY, fromDate: '2027-03-03', toDate: '2027-03-05',
    completion, checkpoint,
    requirements: Object.freeze({
      explicitCleanupAuthorizationRequired: true,
      targetMustRemainDurable: true
    })
  });
  const authorization = createCalendarReplacementCleanupAuthorization({ readiness, approved: true });
  return { storage, repository, state, readiness, authorization, checkpoint };
}

{
  const f = fixture();
  const before = serializeGameState(f.repository.load('franchise').state);
  const result = executeCalendarReplacementCleanup(f);
  assert.strictEqual(result.kind, 'calendar-replacement-cleanup-execution');
  assert.strictEqual(result.executed, true);
  assert.strictEqual(result.verified, true);
  assert.strictEqual(result.stagingSlotRemoved, true);
  assert.strictEqual(result.checkpointPreserved, true);
  assert.strictEqual(result.checkpoint, f.checkpoint);
  assert.strictEqual(f.repository.has('calendar-staging'), false);
  assert.strictEqual(f.repository.has('franchise'), true);
  assert.strictEqual(serializeGameState(f.repository.load('franchise').state), before);
  assert.strictEqual(Object.isFrozen(result), true);
}

{
  const f = fixture();
  assert.throws(
    () => executeCalendarReplacementCleanup({
      ...f, authorization: { ...f.authorization, approved: false }
    }),
    error => error.code === 'CALENDAR_REPLACEMENT_CLEANUP_EXECUTION_FAILED'
  );
  assert.strictEqual(f.repository.has('calendar-staging'), true);
}

{
  const f = fixture();
  f.repository.save('franchise', createGameStateEnvelope({
    meta: { currentDate: '2027-03-05' }, extensions: { tampered: true }
  }), { saveId: 'franchise' }, { replace: true });
  assert.throws(
    () => executeCalendarReplacementCleanup(f),
    error => error.code === 'CALENDAR_REPLACEMENT_CLEANUP_EXECUTION_FAILED'
  );
  assert.strictEqual(f.repository.has('calendar-staging'), true);
}

{
  const f = fixture();
  f.repository.remove('calendar-staging');
  assert.throws(
    () => executeCalendarReplacementCleanup(f),
    error => error.code === 'CALENDAR_REPLACEMENT_CLEANUP_EXECUTION_FAILED'
  );
  assert.strictEqual(f.repository.has('franchise'), true);
}

console.log('Calendar replacement cleanup executor tests passed.');
