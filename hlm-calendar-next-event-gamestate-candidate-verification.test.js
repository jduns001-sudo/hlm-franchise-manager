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
const advancementVerification = verifyNextEventCalendarAdvancement({ plan, authorization, result });
const candidate = createNextEventGameStateCalendarCandidate({ state, verification: advancementVerification });

const verification = verifyNextEventGameStateCalendarCandidate({ sourceState: state, candidate });
assert.strictEqual(verification.kind, 'next-event-gamestate-calendar-candidate-verification');
assert.strictEqual(verification.verified, true);
assert.strictEqual(verification.dateOnlyChangeVerified, true);
assert.strictEqual(verification.targetEventMatched, true);
assert.strictEqual(verification.targetEvent, candidate.targetEvent);
assert.strictEqual(verification.sourceState, state);
assert.strictEqual(verification.candidate, candidate);
assert.strictEqual(verification.state, candidate.state);
assert.strictEqual(verification.calendarCandidateVerification.verified, true);
assert.strictEqual(verification.state.meta.currentDate, '2027-03-05');
assert.strictEqual(state.meta.currentDate, '2027-03-03');
assert.strictEqual(Object.isFrozen(verification), true);

assert.throws(() => verifyNextEventGameStateCalendarCandidate({
  sourceState: state,
  candidate: { ...candidate, targetEvent: { ...candidate.targetEvent } }
}), e => e.code === 'NEXT_EVENT_GAMESTATE_CALENDAR_CANDIDATE_VERIFICATION_FAILED');

const tamperedState = JSON.parse(JSON.stringify(candidate.state));
tamperedState.meta.controlledTeamId = 'NYR';
assert.throws(() => verifyNextEventGameStateCalendarCandidate({
  sourceState: state,
  candidate: { ...candidate, state: tamperedState, calendarCandidate: { ...candidate.calendarCandidate, state: tamperedState } }
}), e => e.code === 'NEXT_EVENT_GAMESTATE_CALENDAR_CANDIDATE_VERIFICATION_FAILED');

assert.throws(() => verifyNextEventGameStateCalendarCandidate({
  sourceState: createGameStateEnvelope({ meta: { currentDate: '2027-03-04' } }),
  candidate
}), e => e.code === 'NEXT_EVENT_GAMESTATE_CALENDAR_CANDIDATE_VERIFICATION_FAILED');

console.log('Next-event GameState calendar candidate verification tests passed.');
