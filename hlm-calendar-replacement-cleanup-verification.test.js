'use strict';
const assert = require('assert');
const { DEFAULT_STORAGE_KEY, createBrowserSaveAdapter } = require('./hlm-browser-save-adapter');
const { createGameStateEnvelope } = require('./hlm-game-state');
const { createCalendarReplacementCleanupAuthorization } = require('./hlm-calendar-replacement-cleanup-authorization');
const { executeCalendarReplacementCleanup } = require('./hlm-calendar-replacement-cleanup-executor');
const { verifyCalendarReplacementCleanup } = require('./hlm-calendar-replacement-cleanup-verification');

function memoryStorage() {
  const data = new Map();
  return {
    getItem: key => data.has(key) ? data.get(key) : null,
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: key => data.delete(key)
  };
}

function fixture() {
  const repository = createBrowserSaveAdapter(memoryStorage());
  const state = createGameStateEnvelope({ meta: { currentDate: '2027-03-05' } });
  repository.save('franchise', state, { saveId: 'franchise' });
  repository.save('calendar-staging', state, { saveId: 'calendar-staging' });

  const checkpoint = Object.freeze({ marker: 'checkpoint' });
  const replacementExecution = Object.freeze({ candidateState: state });
  const completion = Object.freeze({
    kind: 'calendar-replacement-transaction-completion', complete: true,
    candidateSlotId: 'calendar-staging', targetSlotId: 'franchise',
    storageKey: DEFAULT_STORAGE_KEY, fromDate: '2027-03-03', toDate: '2027-03-05',
    checkpoint, execution: replacementExecution
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
  const execution = executeCalendarReplacementCleanup({ readiness, authorization, repository });
  return { repository, state, checkpoint, readiness, authorization, completion, execution };
}

{
  const f = fixture();
  const result = verifyCalendarReplacementCleanup({ execution: f.execution, repository: f.repository });
  assert.strictEqual(result.kind, 'calendar-replacement-cleanup-verification');
  assert.strictEqual(result.verified, true);
  assert.strictEqual(result.stagingSlotAbsent, true);
  assert.strictEqual(result.targetMatchesAuthorizedCandidate, true);
  assert.strictEqual(result.checkpointPreserved, true);
  assert.strictEqual(result.lineageIntact, true);
  assert.strictEqual(result.checkpoint, f.checkpoint);
  assert.strictEqual(result.readiness, f.readiness);
  assert.strictEqual(result.authorization, f.authorization);
  assert.strictEqual(f.repository.has('calendar-staging'), false);
  assert.strictEqual(f.repository.has('franchise'), true);
  assert.strictEqual(Object.isFrozen(result), true);
}

{
  const f = fixture();
  f.repository.save('calendar-staging', f.state, { saveId: 'calendar-staging' });
  assert.throws(
    () => verifyCalendarReplacementCleanup({ execution: f.execution, repository: f.repository }),
    error => error.code === 'CALENDAR_REPLACEMENT_CLEANUP_VERIFICATION_FAILED'
  );
}

{
  const f = fixture();
  f.repository.save('franchise', createGameStateEnvelope({
    meta: { currentDate: '2027-03-05' }, extensions: { tampered: true }
  }), { saveId: 'franchise' }, { replace: true });
  assert.throws(
    () => verifyCalendarReplacementCleanup({ execution: f.execution, repository: f.repository }),
    error => error.code === 'CALENDAR_REPLACEMENT_CLEANUP_VERIFICATION_FAILED'
  );
}

{
  const f = fixture();
  const broken = { ...f.execution, authorization: { ...f.authorization, readiness: { ...f.readiness } } };
  assert.throws(
    () => verifyCalendarReplacementCleanup({ execution: broken, repository: f.repository }),
    error => error.code === 'CALENDAR_REPLACEMENT_CLEANUP_VERIFICATION_FAILED'
  );
}

console.log('Calendar replacement cleanup verification tests passed.');
