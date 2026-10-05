'use strict';
const assert = require('assert');
const { createGameStateEnvelope } = require('./hlm-game-state');
const {
  createCalendarPersistenceAuthorization,
  assertCalendarPersistenceAuthorized
} = require('./hlm-calendar-persistence-authorization');

function readiness() {
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

const ready = readiness();

assert.throws(
  () => createCalendarPersistenceAuthorization({ readiness: ready }),
  error => error.code === 'CALENDAR_PERSISTENCE_NOT_APPROVED'
);

const authorization = createCalendarPersistenceAuthorization({ readiness: ready, approved: true });
assert.strictEqual(authorization.kind, 'calendar-persistence-authorization');
assert.strictEqual(authorization.version, 1);
assert.strictEqual(authorization.approved, true);
assert.strictEqual(authorization.fromDate, '2027-03-03');
assert.strictEqual(authorization.toDate, '2027-03-05');
assert.strictEqual(authorization.readiness, ready);
assert.strictEqual(authorization.candidateState, ready.candidateState);
assert.strictEqual(Object.isFrozen(authorization), true);
assert.strictEqual(assertCalendarPersistenceAuthorized(ready, authorization), true);

const replacement = readiness();
assert.throws(
  () => assertCalendarPersistenceAuthorized(replacement, authorization),
  error => error.code === 'CALENDAR_PERSISTENCE_AUTHORIZATION_MISMATCH'
);

assert.throws(
  () => createCalendarPersistenceAuthorization({ readiness: { ...ready, ready: false }, approved: true }),
  error => error.code === 'INVALID_CALENDAR_PERSISTENCE_AUTHORIZATION'
);

assert.throws(
  () => createCalendarPersistenceAuthorization({
    readiness: {
      ...ready,
      requirements: { ...ready.requirements, rollbackOnFailureRequired: false }
    },
    approved: true
  }),
  error => error.code === 'INVALID_CALENDAR_PERSISTENCE_AUTHORIZATION'
);

console.log('Calendar persistence authorization tests passed.');
