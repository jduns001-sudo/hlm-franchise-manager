'use strict';
const assert = require('assert');
const { createGameStateEnvelope } = require('./hlm-game-state');
const { createCalendarPersistenceAuthorization } = require('./hlm-calendar-persistence-authorization');
const { createCalendarPersistenceExecutionPackage } = require('./hlm-calendar-persistence-execution-package');
const { createCalendarPersistenceExecutionAuthorization } = require('./hlm-calendar-persistence-execution-authorization');
const { executeIsolatedCalendarPersistence } = require('./hlm-calendar-persistence-executor');

function buildAuthorizedPackage() {
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
  return { pkg, authorization };
}

function memoryRepository(options = {}) {
  const slots = new Map();
  return {
    slots,
    has: id => slots.has(id),
    save(id, state, metadata, saveOptions) {
      assert.strictEqual(saveOptions.replace, false);
      slots.set(id, { state, metadata });
    },
    load(id) {
      const value = slots.get(id);
      if (!value) throw new Error('missing');
      if (options.corruptLoad) return { state: { broken: true } };
      return value;
    },
    remove(id) { slots.delete(id); }
  };
}

const { pkg, authorization } = buildAuthorizedPackage();
const repo = memoryRepository();
const result = executeIsolatedCalendarPersistence({
  package: pkg, authorization, repository: repo, slotId: 'calendar-isolated-1'
});

assert.strictEqual(result.kind, 'isolated-calendar-persistence-execution');
assert.strictEqual(result.executed, true);
assert.strictEqual(result.verified, true);
assert.strictEqual(result.rolledBack, false);
assert.strictEqual(result.slotId, 'calendar-isolated-1');
assert.strictEqual(result.fromDate, '2027-03-03');
assert.strictEqual(result.toDate, '2027-03-05');
assert.strictEqual(result.package, pkg);
assert.strictEqual(result.authorization, authorization);
assert.strictEqual(Object.isFrozen(result), true);
assert.strictEqual(repo.slots.get('calendar-isolated-1').state, pkg.candidateState);

assert.throws(
  () => executeIsolatedCalendarPersistence({ package: pkg, authorization: {}, repository: memoryRepository(), slotId: 'x' }),
  error => error.code === 'CALENDAR_PERSISTENCE_EXECUTION_NOT_AUTHORIZED'
);

const occupied = memoryRepository();
occupied.slots.set('existing', { state: pkg.candidateState });
assert.throws(
  () => executeIsolatedCalendarPersistence({ package: pkg, authorization, repository: occupied, slotId: 'existing' }),
  error => error.code === 'CALENDAR_PERSISTENCE_TARGET_OCCUPIED'
);
assert.strictEqual(occupied.has('existing'), true);

const corrupt = memoryRepository({ corruptLoad: true });
assert.throws(
  () => executeIsolatedCalendarPersistence({ package: pkg, authorization, repository: corrupt, slotId: 'rollback' }),
  error => error.persistenceRolledBack === true
);
assert.strictEqual(corrupt.has('rollback'), false);

assert.throws(
  () => executeIsolatedCalendarPersistence({ package: pkg, authorization, repository: {}, slotId: 'x' }),
  error => error.code === 'INVALID_CALENDAR_PERSISTENCE_REPOSITORY'
);

console.log('Isolated calendar persistence executor tests passed.');
