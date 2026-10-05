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

const state = createGameStateEnvelope({
  meta: { currentDate: '2027-03-03', controlledTeamId: 'PIT' },
  players: [{ id: 'p1', name: 'Player One' }]
});
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

const activation = activateNextEventGameStateCalendarCandidate({ verification, authorization });
assert.strictEqual(activation.kind, 'isolated-next-event-gamestate-calendar-activation');
assert.strictEqual(activation.version, 1);
assert.strictEqual(activation.activated, true);
assert.strictEqual(activation.fromDate, '2027-03-03');
assert.strictEqual(activation.toDate, '2027-03-05');
assert.strictEqual(activation.targetEvent, verification.targetEvent);
assert.strictEqual(activation.verification, verification);
assert.strictEqual(activation.authorization, authorization);
assert.strictEqual(activation.state, candidate.state);
assert.strictEqual(activation.state.meta.currentDate, '2027-03-05');
assert.strictEqual(activation.state.meta.controlledTeamId, 'PIT');
assert.strictEqual(state.meta.currentDate, '2027-03-03');
assert.strictEqual(Object.isFrozen(activation), true);

assert.throws(() => activateNextEventGameStateCalendarCandidate({
  verification: { ...verification }, authorization
}), e => e.code === 'NEXT_EVENT_GAMESTATE_CALENDAR_ACTIVATION_FAILED');

assert.throws(() => activateNextEventGameStateCalendarCandidate({
  verification, authorization: { ...authorization, targetEvent: { ...authorization.targetEvent } }
}), e => e.code === 'NEXT_EVENT_GAMESTATE_CALENDAR_ACTIVATION_FAILED');

console.log('Isolated next-event GameState calendar activation tests passed.');
