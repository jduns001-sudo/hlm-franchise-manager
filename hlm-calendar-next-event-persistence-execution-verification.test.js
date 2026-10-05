'use strict';
const assert = require('assert');
const { createGameStateEnvelope } = require('./hlm-game-state');
const { createNextEventCalendarPersistenceExecutionAuthorization } = require('./hlm-calendar-next-event-persistence-execution-authorization');
const { executeIsolatedNextEventCalendarPersistence } = require('./hlm-calendar-next-event-persistence-executor');
const { verifyNextEventCalendarPersistenceExecution } = require('./hlm-calendar-next-event-persistence-execution-verification');

function buildExecution() {
  const state = createGameStateEnvelope({ meta: { currentDate: '2027-03-05', controlledTeamId: 'PIT' } });
  const targetEvent = Object.freeze({ id: 'game-1', type: 'game', date: '2027-03-05', important: true });
  const readiness = Object.freeze({ targetEvent, candidateState: state });
  const persistenceAuthorization = Object.freeze({ targetEvent, candidateState: state });
  const pkg = Object.freeze({
    kind: 'next-event-calendar-persistence-execution-package', version: 1,
    packaged: true, executable: false, fromDate: '2027-03-03', toDate: '2027-03-05',
    targetEvent, readiness, authorization: persistenceAuthorization, candidateState: state,
    transaction: Object.freeze({ verifyAfterWrite: true, rollbackOnFailure: true, executionAuthorizationRequired: true })
  });
  const authorization = createNextEventCalendarPersistenceExecutionAuthorization({ package: pkg, approved: true });
  const slots = new Map();
  const repository = {
    has: id => slots.has(id),
    save: (id, savedState, metadata) => slots.set(id, { state: savedState, metadata }),
    load: id => slots.get(id),
    remove: id => slots.delete(id)
  };
  return executeIsolatedNextEventCalendarPersistence({
    package: pkg, authorization, repository, slotId: 'next-event-verification-1'
  });
}

const execution = buildExecution();
const verification = verifyNextEventCalendarPersistenceExecution({ execution });
assert.strictEqual(verification.kind, 'next-event-calendar-persistence-execution-verification');
assert.strictEqual(verification.version, 1);
assert.strictEqual(verification.verified, true);
assert.strictEqual(verification.slotId, 'next-event-verification-1');
assert.strictEqual(verification.fromDate, '2027-03-03');
assert.strictEqual(verification.toDate, '2027-03-05');
assert.strictEqual(verification.targetEvent, execution.targetEvent);
assert.strictEqual(verification.execution, execution);
assert.strictEqual(Object.isFrozen(verification), true);

assert.throws(() => verifyNextEventCalendarPersistenceExecution({ execution: { ...execution, verified: false } }),
  e => e.code === 'NEXT_EVENT_CALENDAR_PERSISTENCE_EXECUTION_VERIFICATION_FAILED');
assert.throws(() => verifyNextEventCalendarPersistenceExecution({ execution: { ...execution, slotId: '' } }),
  e => e.code === 'NEXT_EVENT_CALENDAR_PERSISTENCE_EXECUTION_VERIFICATION_FAILED');
assert.throws(() => verifyNextEventCalendarPersistenceExecution({ execution: { ...execution, toDate: '2027-03-06' } }),
  e => e.code === 'NEXT_EVENT_CALENDAR_PERSISTENCE_EXECUTION_VERIFICATION_FAILED');
assert.throws(() => verifyNextEventCalendarPersistenceExecution({
  execution: { ...execution, targetEvent: { ...execution.targetEvent } }
}), e => e.code === 'NEXT_EVENT_CALENDAR_PERSISTENCE_EXECUTION_VERIFICATION_FAILED');
assert.throws(() => verifyNextEventCalendarPersistenceExecution({
  execution: { ...execution, package: { ...execution.package } }
}), e => e.code === 'NEXT_EVENT_CALENDAR_PERSISTENCE_EXECUTION_VERIFICATION_FAILED');
assert.throws(() => verifyNextEventCalendarPersistenceExecution({}),
  e => e.code === 'NEXT_EVENT_CALENDAR_PERSISTENCE_EXECUTION_VERIFICATION_FAILED');

console.log('Next-event calendar persistence execution verification tests passed.');
