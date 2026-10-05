'use strict';
const assert = require('assert');
const { createGameStateEnvelope } = require('./hlm-game-state');
const {
  createCalendarPersistenceAuthorization
} = require('./hlm-calendar-persistence-authorization');
const {
  createCalendarPersistenceExecutionPackage
} = require('./hlm-calendar-persistence-execution-package');

function buildReadiness() {
  const state = createGameStateEnvelope({ meta: { currentDate: '2027-03-05' } });
  const activation = { state };
  const verification = { activation };
  return Object.freeze({
    kind: 'calendar-persistence-readiness',
    version: 1,
    ready: true,
    fromDate: '2027-03-03',
    toDate: '2027-03-05',
    verification,
    candidateState: state,
    requirements: Object.freeze({
      explicitPersistenceAuthorizationRequired: true,
      verifyAfterWriteRequired: true,
      rollbackOnFailureRequired: true
    })
  });
}

const readiness = buildReadiness();
const authorization = createCalendarPersistenceAuthorization({ readiness, approved: true });
const pkg = createCalendarPersistenceExecutionPackage({ readiness, authorization });

assert.strictEqual(pkg.kind, 'calendar-persistence-execution-package');
assert.strictEqual(pkg.version, 1);
assert.strictEqual(pkg.packaged, true);
assert.strictEqual(pkg.executable, false);
assert.strictEqual(pkg.fromDate, '2027-03-03');
assert.strictEqual(pkg.toDate, '2027-03-05');
assert.strictEqual(pkg.readiness, readiness);
assert.strictEqual(pkg.authorization, authorization);
assert.strictEqual(pkg.candidateState, readiness.candidateState);
assert.strictEqual(pkg.transaction.verifyAfterWrite, true);
assert.strictEqual(pkg.transaction.rollbackOnFailure, true);
assert.strictEqual(pkg.transaction.executionAuthorizationRequired, true);
assert.strictEqual(Object.isFrozen(pkg), true);
assert.strictEqual(Object.isFrozen(pkg.transaction), true);

const replacementReadiness = buildReadiness();
assert.throws(
  () => createCalendarPersistenceExecutionPackage({
    readiness: replacementReadiness,
    authorization
  }),
  error => error.code === 'INVALID_CALENDAR_PERSISTENCE_EXECUTION_PACKAGE'
);

assert.throws(
  () => createCalendarPersistenceExecutionPackage({ readiness, authorization: {} }),
  error => error.code === 'INVALID_CALENDAR_PERSISTENCE_EXECUTION_PACKAGE'
);

console.log('Calendar persistence execution package tests passed.');
