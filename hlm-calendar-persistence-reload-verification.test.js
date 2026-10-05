'use strict';
const assert = require('assert');
const { createGameStateEnvelope } = require('./hlm-game-state');
const { createBrowserSaveAdapter } = require('./hlm-browser-save-adapter');
const { createCalendarPersistenceAuthorization } = require('./hlm-calendar-persistence-authorization');
const { createCalendarPersistenceExecutionPackage } = require('./hlm-calendar-persistence-execution-package');
const { createCalendarPersistenceExecutionAuthorization } = require('./hlm-calendar-persistence-execution-authorization');
const { executeIsolatedCalendarPersistence } = require('./hlm-calendar-persistence-executor');
const { verifyCalendarPersistenceExecution } = require('./hlm-calendar-persistence-execution-verification');
const { verifyPersistedCalendarGameStateReload } = require('./hlm-calendar-persistence-reload-verification');

function memoryStorage() {
  const data = new Map();
  return {
    getItem: key => data.has(key) ? data.get(key) : null,
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: key => data.delete(key)
  };
}

function build() {
  const state = createGameStateEnvelope({
    meta: { currentDate: '2027-03-05' },
    extensions: { reloadMarker: 'mission-108' }
  });
  const readiness = Object.freeze({
    kind: 'calendar-persistence-readiness', version: 1, ready: true,
    fromDate: '2027-03-03', toDate: '2027-03-05',
    verification: { activation: { state } }, candidateState: state,
    requirements: Object.freeze({
      explicitPersistenceAuthorizationRequired: true,
      verifyAfterWriteRequired: true,
      rollbackOnFailureRequired: true
    })
  });
  const persistenceAuthorization = createCalendarPersistenceAuthorization({ readiness, approved: true });
  const pkg = createCalendarPersistenceExecutionPackage({ readiness, authorization: persistenceAuthorization });
  const authorization = createCalendarPersistenceExecutionAuthorization({ package: pkg, approved: true });
  const repository = createBrowserSaveAdapter(memoryStorage(), 'mission108_test_saves');
  const execution = executeIsolatedCalendarPersistence({
    package: pkg, authorization, repository, slotId: 'reload-slot'
  });
  return { repository, verification: verifyCalendarPersistenceExecution({ execution }), expected: state };
}

const { repository, verification, expected } = build();
const result = verifyPersistedCalendarGameStateReload({ verification, repository });

assert.strictEqual(result.kind, 'persisted-calendar-gamestate-reload-verification');
assert.strictEqual(result.version, 1);
assert.strictEqual(result.verified, true);
assert.strictEqual(result.slotId, 'reload-slot');
assert.strictEqual(result.fromDate, '2027-03-03');
assert.strictEqual(result.toDate, '2027-03-05');
assert.strictEqual(result.verification, verification);
assert.notStrictEqual(result.state, expected);
assert.strictEqual(result.state.extensions.reloadMarker, 'mission-108');
assert.strictEqual(Object.isFrozen(result), true);

assert.throws(
  () => verifyPersistedCalendarGameStateReload({ verification: { ...verification, verified: false }, repository }),
  error => error.code === 'CALENDAR_PERSISTENCE_RELOAD_VERIFICATION_FAILED'
);

const wrongDateRepository = { load: () => ({ state: createGameStateEnvelope({ meta: { currentDate: '2027-03-06' } }) }) };
assert.throws(
  () => verifyPersistedCalendarGameStateReload({ verification, repository: wrongDateRepository }),
  error => error.code === 'CALENDAR_PERSISTENCE_RELOAD_VERIFICATION_FAILED'
);

const changedStateRepository = {
  load: () => ({ state: createGameStateEnvelope({
    meta: { currentDate: '2027-03-05' },
    extensions: { reloadMarker: 'tampered' }
  }) })
};
assert.throws(
  () => verifyPersistedCalendarGameStateReload({ verification, repository: changedStateRepository }),
  error => error.code === 'CALENDAR_PERSISTENCE_RELOAD_VERIFICATION_FAILED'
);

assert.throws(
  () => verifyPersistedCalendarGameStateReload({ verification, repository: {} }),
  error => error.code === 'CALENDAR_PERSISTENCE_RELOAD_VERIFICATION_FAILED'
);

console.log('Persisted calendar GameState reload verification tests passed.');
