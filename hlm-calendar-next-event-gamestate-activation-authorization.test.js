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
const {
  createNextEventGameStateCalendarActivationAuthorization,
  assertNextEventGameStateCalendarActivationAuthorized
} = require('./hlm-calendar-next-event-gamestate-activation-authorization');

const state = createGameStateEnvelope({ meta: { currentDate: '2027-03-03', controlledTeamId: 'PIT' } });
const calendar = createMasterCalendar({ currentDate: state.meta.currentDate });
const timeline = createSeasonPhaseTimeline({ windows: [
  { phaseId: 'regular-season', startDate: '2027-03-01', endDate: '2027-03-10' }
]});
const eventIndex = createCalendarEventIndex({ events: [
  { id: 'game-1', type: 'game', date: '2027-03-05', important: true }
]});
const plan = createNextEventCalendarAdvancementPlan({ calendar, timeline, eventIndex, importantOnly: true });
const advancementAuthorization = createNextEventCalendarAdvancementAuthorization({ plan, approved: true });
const result = executeIsolatedNextEventCalendarAdvancement({ calendar, plan, authorization: advancementAuthorization });
const advancementVerification = verifyNextEventCalendarAdvancement({ plan, authorization: advancementAuthorization, result });
const candidate = createNextEventGameStateCalendarCandidate({ state, verification: advancementVerification });
const verification = verifyNextEventGameStateCalendarCandidate({ sourceState: state, candidate });

const authorization = createNextEventGameStateCalendarActivationAuthorization({ verification, approved: true });
assert.strictEqual(authorization.kind, 'next-event-gamestate-calendar-activation-authorization');
assert.strictEqual(authorization.version, 1);
assert.strictEqual(authorization.approved, true);
assert.strictEqual(authorization.verification, verification);
assert.strictEqual(authorization.targetEvent, verification.targetEvent);
assert.strictEqual(authorization.fromDate, '2027-03-03');
assert.strictEqual(authorization.toDate, '2027-03-05');
assert.strictEqual(Object.isFrozen(authorization), true);
assert.strictEqual(assertNextEventGameStateCalendarActivationAuthorized(verification, authorization), true);

assert.throws(() => createNextEventGameStateCalendarActivationAuthorization({
  verification, approved: false
}), e => e.code === 'NEXT_EVENT_GAMESTATE_CALENDAR_ACTIVATION_NOT_AUTHORIZED');

assert.throws(() => assertNextEventGameStateCalendarActivationAuthorized(
  { ...verification }, authorization
), e => e.code === 'NEXT_EVENT_GAMESTATE_CALENDAR_ACTIVATION_NOT_AUTHORIZED');

assert.throws(() => assertNextEventGameStateCalendarActivationAuthorized(
  verification, { ...authorization, targetEvent: { ...authorization.targetEvent } }
), e => e.code === 'NEXT_EVENT_GAMESTATE_CALENDAR_ACTIVATION_NOT_AUTHORIZED');

console.log('Next-event GameState calendar activation authorization tests passed.');
