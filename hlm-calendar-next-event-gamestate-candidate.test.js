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
const authorization = createNextEventCalendarAdvancementAuthorization({ plan, approved: true });
const result = executeIsolatedNextEventCalendarAdvancement({ calendar, plan, authorization });
const verification = verifyNextEventCalendarAdvancement({ plan, authorization, result });

const candidate = createNextEventGameStateCalendarCandidate({ state, verification });
assert.strictEqual(candidate.kind, 'next-event-gamestate-calendar-candidate');
assert.strictEqual(candidate.version, 1);
assert.strictEqual(candidate.fromDate, '2027-03-03');
assert.strictEqual(candidate.toDate, '2027-03-05');
assert.strictEqual(candidate.targetEvent, verification.targetEvent);
assert.strictEqual(candidate.verification, verification);
assert.strictEqual(candidate.state, candidate.calendarCandidate.state);
assert.strictEqual(candidate.state.meta.currentDate, '2027-03-05');
assert.strictEqual(candidate.state.meta.controlledTeamId, 'PIT');
assert.deepStrictEqual(candidate.state.universe.players, state.universe.players);
assert.strictEqual(state.meta.currentDate, '2027-03-03');
assert.strictEqual(Object.isFrozen(candidate), true);

assert.throws(() => createNextEventGameStateCalendarCandidate({
  state, verification: { ...verification, verified: false }
}), e => e.code === 'INVALID_NEXT_EVENT_GAMESTATE_CALENDAR_CANDIDATE');

assert.throws(() => createNextEventGameStateCalendarCandidate({
  state: createGameStateEnvelope({ meta: { currentDate: '2027-03-04' } }),
  verification
}), e => e.code === 'INVALID_NEXT_EVENT_GAMESTATE_CALENDAR_CANDIDATE');

assert.throws(() => createNextEventGameStateCalendarCandidate({
  state,
  verification: { ...verification, targetEvent: { ...verification.targetEvent, date: '2027-03-06' } }
}), e => e.code === 'INVALID_NEXT_EVENT_GAMESTATE_CALENDAR_CANDIDATE');

console.log('Next-event GameState calendar candidate tests passed.');
