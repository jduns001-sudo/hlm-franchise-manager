'use strict';
const assert = require('assert');
const { createGameStateEnvelope } = require('./hlm-game-state');
const { createCalendarPersistenceAuthorization } = require('./hlm-calendar-persistence-authorization');
const { createCalendarPersistenceExecutionPackage } = require('./hlm-calendar-persistence-execution-package');
const { createCalendarPersistenceExecutionAuthorization } = require('./hlm-calendar-persistence-execution-authorization');
const { executeIsolatedCalendarPersistence } = require('./hlm-calendar-persistence-executor');
const { verifyCalendarPersistenceExecution } = require('./hlm-calendar-persistence-execution-verification');

function buildExecution() {
  const state = createGameStateEnvelope({ meta: { currentDate: '2027-03-05' } });
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
  const slots = new Map();
  const repository = {
    has: id => slots.has(id),
    save: (id, savedState, metadata) => slots.set(id, { state: savedState, metadata }),
    load: id => slots.get(id),
    remove: id => slots.delete(id)
  };
  return executeIsolatedCalendarPersistence({
    package: pkg, authorization, repository, slotId: 'calendar-verification-1'
  });
}

const execution = buildExecution();
const verification = verifyCalendarPersistenceExecution({ execution });

assert.strictEqual(verification.kind, 'calendar-persistence-execution-verification');
assert.strictEqual(verification.version, 1);
assert.strictEqual(verification.verified, true);
assert.strictEqual(verification.slotId, 'calendar-verification-1');
assert.strictEqual(verification.fromDate, '2027-03-03');
assert.strictEqual(verification.toDate, '2027-03-05');
assert.strictEqual(verification.execution, execution);
assert.strictEqual(Object.isFrozen(verification), true);

assert.throws(
  () => verifyCalendarPersistenceExecution({ execution: { ...execution, verified: false } }),
  error => error.code === 'CALENDAR_PERSISTENCE_EXECUTION_VERIFICATION_FAILED'
);

assert.throws(
  () => verifyCalendarPersistenceExecution({ execution: { ...execution, slotId: '' } }),
  error => error.code === 'CALENDAR_PERSISTENCE_EXECUTION_VERIFICATION_FAILED'
);

assert.throws(
  () => verifyCalendarPersistenceExecution({ execution: { ...execution, toDate: '2027-03-06' } }),
  error => error.code === 'CALENDAR_PERSISTENCE_EXECUTION_VERIFICATION_FAILED'
);

assert.throws(
  () => verifyCalendarPersistenceExecution({
    execution: { ...execution, package: { ...execution.package } }
  }),
  error => error.code === 'CALENDAR_PERSISTENCE_EXECUTION_VERIFICATION_FAILED'
);

assert.throws(
  () => verifyCalendarPersistenceExecution({}),
  error => error.code === 'CALENDAR_PERSISTENCE_EXECUTION_VERIFICATION_FAILED'
);

console.log('Calendar persistence execution verification tests passed.');
