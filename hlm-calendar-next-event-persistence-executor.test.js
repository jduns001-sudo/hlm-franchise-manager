'use strict';
const assert = require('assert');
const { createGameStateEnvelope } = require('./hlm-game-state');
const { createNextEventCalendarPersistenceExecutionAuthorization } = require('./hlm-calendar-next-event-persistence-execution-authorization');
const { executeIsolatedNextEventCalendarPersistence } = require('./hlm-calendar-next-event-persistence-executor');

function buildAuthorizedPackage() {
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
const result = executeIsolatedNextEventCalendarPersistence({
  package: pkg, authorization, repository: repo, slotId: 'next-event-isolated-1'
});
assert.strictEqual(result.kind, 'isolated-next-event-calendar-persistence-execution');
assert.strictEqual(result.executed, true);
assert.strictEqual(result.verified, true);
assert.strictEqual(result.rolledBack, false);
assert.strictEqual(result.targetEvent, pkg.targetEvent);
assert.strictEqual(result.package, pkg);
assert.strictEqual(result.authorization, authorization);
assert.strictEqual(Object.isFrozen(result), true);
assert.strictEqual(repo.slots.get('next-event-isolated-1').state, pkg.candidateState);

assert.throws(() => executeIsolatedNextEventCalendarPersistence({
  package: pkg, authorization: {}, repository: memoryRepository(), slotId: 'x'
}), e => e.code === 'NEXT_EVENT_CALENDAR_PERSISTENCE_EXECUTION_NOT_AUTHORIZED');

const occupied = memoryRepository();
occupied.slots.set('existing', { state: pkg.candidateState });
assert.throws(() => executeIsolatedNextEventCalendarPersistence({
  package: pkg, authorization, repository: occupied, slotId: 'existing'
}), e => e.code === 'NEXT_EVENT_CALENDAR_PERSISTENCE_TARGET_OCCUPIED');
assert.strictEqual(occupied.has('existing'), true);

const corrupt = memoryRepository({ corruptLoad: true });
assert.throws(() => executeIsolatedNextEventCalendarPersistence({
  package: pkg, authorization, repository: corrupt, slotId: 'rollback'
}), e => e.persistenceRolledBack === true);
assert.strictEqual(corrupt.has('rollback'), false);

assert.throws(() => executeIsolatedNextEventCalendarPersistence({
  package: pkg, authorization, repository: {}, slotId: 'x'
}), e => e.code === 'INVALID_NEXT_EVENT_CALENDAR_PERSISTENCE_REPOSITORY');

console.log('Isolated next-event calendar persistence executor tests passed.');
