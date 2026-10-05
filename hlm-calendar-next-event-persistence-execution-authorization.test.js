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
const { createNextEventCalendarPersistenceExecutionAuthorization, assertNextEventCalendarPersistenceExecutionAuthorized } = require('./hlm-calendar-next-event-persistence-execution-authorization');

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
const persistenceAuth = createNextEventCalendarPersistenceAuthorization({ readiness, approved: true });
const pkg = createNextEventCalendarPersistenceExecutionPackage({ readiness, authorization: persistenceAuth });
const authorization = createNextEventCalendarPersistenceExecutionAuthorization({ package: pkg, approved: true });

assert.strictEqual(authorization.kind, 'next-event-calendar-persistence-execution-authorization');
assert.strictEqual(authorization.approved, true);
assert.strictEqual(authorization.package, pkg);
assert.strictEqual(authorization.targetEvent, pkg.targetEvent);
assert.strictEqual(authorization.candidateState, pkg.candidateState);
assert.strictEqual(Object.isFrozen(authorization), true);
assert.strictEqual(assertNextEventCalendarPersistenceExecutionAuthorized(pkg, authorization), true);
assert.throws(() => createNextEventCalendarPersistenceExecutionAuthorization({ package: pkg, approved: false }),
  e => e.code === 'NEXT_EVENT_CALENDAR_PERSISTENCE_EXECUTION_NOT_APPROVED');
assert.throws(() => assertNextEventCalendarPersistenceExecutionAuthorized({ ...pkg }, authorization),
  e => e.code === 'NEXT_EVENT_CALENDAR_PERSISTENCE_EXECUTION_AUTHORIZATION_MISMATCH');
assert.throws(() => assertNextEventCalendarPersistenceExecutionAuthorized(pkg, { ...authorization, targetEvent: { ...authorization.targetEvent } }),
  e => e.code === 'NEXT_EVENT_CALENDAR_PERSISTENCE_EXECUTION_AUTHORIZATION_MISMATCH');

console.log('Next-event calendar persistence execution authorization tests passed.');
