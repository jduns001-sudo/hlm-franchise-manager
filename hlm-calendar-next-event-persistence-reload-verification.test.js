'use strict';
const assert = require('assert');
const { createGameStateEnvelope } = require('./hlm-game-state');
const { createNextEventCalendarPersistenceExecutionAuthorization } = require('./hlm-calendar-next-event-persistence-execution-authorization');
const { executeIsolatedNextEventCalendarPersistence } = require('./hlm-calendar-next-event-persistence-executor');
const { verifyNextEventCalendarPersistenceExecution } = require('./hlm-calendar-next-event-persistence-execution-verification');
const { verifyPersistedNextEventCalendarGameStateReload } = require('./hlm-calendar-next-event-persistence-reload-verification');

function build() {
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
    slots,
    has: id => slots.has(id),
    save: (id, savedState, metadata) => slots.set(id, { state: savedState, metadata }),
    load: id => {
      const value = slots.get(id);
      if (!value) throw new Error('missing');
      return value;
    },
    remove: id => slots.delete(id)
  };
  const execution = executeIsolatedNextEventCalendarPersistence({
    package: pkg, authorization, repository, slotId: 'next-event-reload-1'
  });
  const verification = verifyNextEventCalendarPersistenceExecution({ execution });
  return { state, targetEvent, repository, execution, verification };
}

const built = build();
const reload = verifyPersistedNextEventCalendarGameStateReload({
  verification: built.verification, repository: built.repository
});
assert.strictEqual(reload.kind, 'persisted-next-event-calendar-gamestate-reload-verification');
assert.strictEqual(reload.version, 1);
assert.strictEqual(reload.verified, true);
assert.strictEqual(reload.slotId, 'next-event-reload-1');
assert.strictEqual(reload.fromDate, '2027-03-03');
assert.strictEqual(reload.toDate, '2027-03-05');
assert.strictEqual(reload.targetEvent, built.targetEvent);
assert.strictEqual(reload.verification, built.verification);
assert.strictEqual(Object.isFrozen(reload), true);

assert.throws(() => verifyPersistedNextEventCalendarGameStateReload({
  verification: { ...built.verification, targetEvent: { ...built.targetEvent } }, repository: built.repository
}), e => e.code === 'NEXT_EVENT_CALENDAR_PERSISTENCE_RELOAD_VERIFICATION_FAILED');

const altered = build();
altered.repository.slots.set('next-event-reload-1', {
  state: createGameStateEnvelope({ meta: { currentDate: '2027-03-05', controlledTeamId: 'BOS' } })
});
assert.throws(() => verifyPersistedNextEventCalendarGameStateReload({
  verification: altered.verification, repository: altered.repository
}), e => e.code === 'NEXT_EVENT_CALENDAR_PERSISTENCE_RELOAD_VERIFICATION_FAILED');

assert.throws(() => verifyPersistedNextEventCalendarGameStateReload({
  verification: built.verification, repository: {}
}), e => e.code === 'NEXT_EVENT_CALENDAR_PERSISTENCE_RELOAD_VERIFICATION_FAILED');

console.log('Persisted next-event calendar GameState reload verification tests passed.');
