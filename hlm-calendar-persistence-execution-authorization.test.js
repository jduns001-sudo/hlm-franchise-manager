'use strict';
const assert = require('assert');
const { createGameStateEnvelope } = require('./hlm-game-state');
const { createCalendarPersistenceAuthorization } = require('./hlm-calendar-persistence-authorization');
const { createCalendarPersistenceExecutionPackage } = require('./hlm-calendar-persistence-execution-package');
const {
  createCalendarPersistenceExecutionAuthorization,
  assertCalendarPersistenceExecutionAuthorized
} = require('./hlm-calendar-persistence-execution-authorization');

function buildPackage() {
  const state = createGameStateEnvelope({ meta: { currentDate: '2027-03-05' } });
  const readiness = Object.freeze({
    kind: 'calendar-persistence-readiness',
    version: 1,
    ready: true,
    fromDate: '2027-03-03',
    toDate: '2027-03-05',
    verification: { activation: { state } },
    candidateState: state,
    requirements: Object.freeze({
      explicitPersistenceAuthorizationRequired: true,
      verifyAfterWriteRequired: true,
      rollbackOnFailureRequired: true
    })
  });
  const authorization = createCalendarPersistenceAuthorization({ readiness, approved: true });
  return createCalendarPersistenceExecutionPackage({ readiness, authorization });
}

const pkg = buildPackage();

assert.throws(
  () => createCalendarPersistenceExecutionAuthorization({ package: pkg }),
  error => error.code === 'CALENDAR_PERSISTENCE_EXECUTION_NOT_APPROVED'
);

const authorization = createCalendarPersistenceExecutionAuthorization({ package: pkg, approved: true });
assert.strictEqual(authorization.kind, 'calendar-persistence-execution-authorization');
assert.strictEqual(authorization.version, 1);
assert.strictEqual(authorization.approved, true);
assert.strictEqual(authorization.package, pkg);
assert.strictEqual(authorization.candidateState, pkg.candidateState);
assert.strictEqual(authorization.fromDate, '2027-03-03');
assert.strictEqual(authorization.toDate, '2027-03-05');
assert.strictEqual(Object.isFrozen(authorization), true);
assert.strictEqual(assertCalendarPersistenceExecutionAuthorized(pkg, authorization), true);

const replacement = buildPackage();
assert.throws(
  () => assertCalendarPersistenceExecutionAuthorized(replacement, authorization),
  error => error.code === 'CALENDAR_PERSISTENCE_EXECUTION_AUTHORIZATION_MISMATCH'
);

assert.throws(
  () => createCalendarPersistenceExecutionAuthorization({
    package: { ...pkg, executable: true },
    approved: true
  }),
  error => error.code === 'INVALID_CALENDAR_PERSISTENCE_EXECUTION_AUTHORIZATION'
);

assert.throws(
  () => createCalendarPersistenceExecutionAuthorization({
    package: { ...pkg, transaction: { ...pkg.transaction, rollbackOnFailure: false } },
    approved: true
  }),
  error => error.code === 'INVALID_CALENDAR_PERSISTENCE_EXECUTION_AUTHORIZATION'
);

console.log('Calendar persistence execution authorization tests passed.');
