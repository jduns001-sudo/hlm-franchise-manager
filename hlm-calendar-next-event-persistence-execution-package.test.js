'use strict';
const assert = require('assert');
const { createGameStateEnvelope } = require('./hlm-game-state');
const { createMasterCalendar } = require('./hlm-master-calendar');
const { createSeasonPhaseTimeline } = require('./hlm-season-phase-timeline');
const { createCalendarEventIndex } = require('./hlm-calendar-event');
const { createNextEventCalendarAdvancementPlan } = require('./hlm-calendar-next-event-advancement-plan');
const { createNextEventCalendarAdvancementAuthorization } = require('./hlm-calendar-next-event-advancement-authorization');
const { executeIsolatedNextEventCalendarAdvancement } = require('./hlm-calendar-next-event-advancement-execution');
const { verifyNextEventCalendarAdvancement } = require('./hlm-calendar-next-event-advancement-verification');
const { createNextEventGameStateCalendarCandidate } = require('./hlm-calendar-next-event-gamestate-candidate');
const { verifyNextEventGameStateCalendarCandidate } = require('./hlm-calendar-next-event-gamestate-candidate-verification');
const { createNextEventGameStateCalendarActivationAuthorization } = require('./hlm-calendar-next-event-gamestate-activation-authorization');
const { activateNextEventGameStateCalendarCandidate } = require('./hlm-calendar-next-event-gamestate-activation');
const { verifyIsolatedNextEventGameStateCalendarActivation } = require('./hlm-calendar-next-event-gamestate-activation-verification');
const { createNextEventCalendarPersistenceReadiness } = require('./hlm-calendar-next-event-persistence-readiness');
const { createNextEventCalendarPersistenceAuthorization } = require('./hlm-calendar-next-event-persistence-authorization');
const { createNextEventCalendarPersistenceExecutionPackage } = require('./hlm-calendar-next-event-persistence-execution-package');

const state = createGameStateEnvelope({ meta: { currentDate: '2027-03-03', controlledTeamId: 'PIT' } });
const calendar = createMasterCalendar({ currentDate: state.meta.currentDate });
const timeline = createSeasonPhaseTimeline({ windows: [{ phaseId: 'regular-season', startDate: '2027-03-01', endDate: '2027-03-10' }] });
const eventIndex = createCalendarEventIndex({ events: [{ id: 'game-1', type: 'game', date: '2027-03-05', important: true }] });
const plan = createNextEventCalendarAdvancementPlan({ calendar, timeline, eventIndex, importantOnly: true });
const advanceAuth = createNextEventCalendarAdvancementAuthorization({ plan, approved: true });
const result = executeIsolatedNextEventCalendarAdvancement({ calendar, plan, authorization: advanceAuth });
const advanceVerify = verifyNextEventCalendarAdvancement({ plan, authorization: advanceAuth, result });
const candidate = createNextEventGameStateCalendarCandidate({ state, verification: advanceVerify });
const candidateVerify = verifyNextEventGameStateCalendarCandidate({ sourceState: state, candidate });
const activationAuth = createNextEventGameStateCalendarActivationAuthorization({ verification: candidateVerify, approved: true });
const activation = activateNextEventGameStateCalendarCandidate({ verification: candidateVerify, authorization: activationAuth });
const activationVerify = verifyIsolatedNextEventGameStateCalendarActivation({ activation });
const readiness = createNextEventCalendarPersistenceReadiness({ verification: activationVerify });
const authorization = createNextEventCalendarPersistenceAuthorization({ readiness, approved: true });

const pkg = createNextEventCalendarPersistenceExecutionPackage({ readiness, authorization });
assert.strictEqual(pkg.kind, 'next-event-calendar-persistence-execution-package');
assert.strictEqual(pkg.version, 1);
assert.strictEqual(pkg.packaged, true);
assert.strictEqual(pkg.executable, false);
assert.strictEqual(pkg.readiness, readiness);
assert.strictEqual(pkg.authorization, authorization);
assert.strictEqual(pkg.targetEvent, readiness.targetEvent);
assert.strictEqual(pkg.candidateState, readiness.candidateState);
assert.strictEqual(pkg.fromDate, '2027-03-03');
assert.strictEqual(pkg.toDate, '2027-03-05');
assert.strictEqual(pkg.transaction.verifyAfterWrite, true);
assert.strictEqual(pkg.transaction.rollbackOnFailure, true);
assert.strictEqual(pkg.transaction.executionAuthorizationRequired, true);
assert.strictEqual(Object.isFrozen(pkg), true);
assert.strictEqual(Object.isFrozen(pkg.transaction), true);

assert.throws(() => createNextEventCalendarPersistenceExecutionPackage({
  readiness: { ...readiness }, authorization
}), e => e.code === 'INVALID_NEXT_EVENT_CALENDAR_PERSISTENCE_EXECUTION_PACKAGE');

assert.throws(() => createNextEventCalendarPersistenceExecutionPackage({
  readiness, authorization: { ...authorization, targetEvent: { ...authorization.targetEvent } }
}), e => e.code === 'INVALID_NEXT_EVENT_CALENDAR_PERSISTENCE_EXECUTION_PACKAGE');

console.log('Next-event calendar persistence execution package tests passed.');
