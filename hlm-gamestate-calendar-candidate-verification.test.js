'use strict';
const assert = require('assert');
const { createGameStateEnvelope } = require('./hlm-game-state');
const { createMasterCalendar } = require('./hlm-master-calendar');
const { createSeasonPhaseTimeline } = require('./hlm-season-phase-timeline');
const { createCalendarEventIndex } = require('./hlm-calendar-event');
const { createCalendarAdvancementPlan } = require('./hlm-calendar-advancement-plan');
const { createCalendarAdvancementAuthorization } = require('./hlm-calendar-advancement-authorization');
const { executeIsolatedCalendarAdvancement } = require('./hlm-calendar-advancement-execution');
const { verifyCalendarAdvancement } = require('./hlm-calendar-advancement-verification');
const { createGameStateCalendarAdvancementCandidate } = require('./hlm-gamestate-calendar-advancement-candidate');
const { verifyGameStateCalendarAdvancementCandidate } = require('./hlm-gamestate-calendar-candidate-verification');

const sourceState = createGameStateEnvelope({
  meta: { saveId: 'save-1', controlledTeamId: 'PIT', currentDate: '2027-03-03' },
  players: [{ id: 'p1', name: 'Player One' }],
  teams: [{ id: 'PIT', name: 'Pittsburgh' }],
  contracts: [{ id: 'c1', playerId: 'p1' }],
  extensions: { marker: 'preserve-me' }
});
const calendar = createMasterCalendar({ currentDate: sourceState.meta.currentDate });
const timeline = createSeasonPhaseTimeline({
  windows: [{ phaseId: 'regular-season', startDate: '2026-10-06', endDate: '2027-04-17' }]
});
const eventIndex = createCalendarEventIndex({ events: [] });
const plan = createCalendarAdvancementPlan({ calendar, timeline, eventIndex, days: 2 });
const authorization = createCalendarAdvancementAuthorization({ plan, approved: true });
const result = executeIsolatedCalendarAdvancement({ calendar, plan, authorization });
const advancementVerification = verifyCalendarAdvancement({ plan, authorization, result });
const candidate = createGameStateCalendarAdvancementCandidate({
  state: sourceState,
  verification: advancementVerification
});

const verification = verifyGameStateCalendarAdvancementCandidate({ sourceState, candidate });
assert.strictEqual(verification.kind, 'gamestate-calendar-candidate-verification');
assert.strictEqual(verification.verified, true);
assert.strictEqual(verification.fromDate, '2027-03-03');
assert.strictEqual(verification.toDate, '2027-03-05');
assert.strictEqual(verification.sourceState, sourceState);
assert.strictEqual(verification.candidate, candidate);
assert.strictEqual(Object.isFrozen(verification), true);

const tamperedState = JSON.parse(JSON.stringify(candidate.state));
tamperedState.universe.players[0].name = 'Tampered Player';
const tamperedCandidate = Object.freeze({ ...candidate, state: tamperedState });
assert.throws(
  () => verifyGameStateCalendarAdvancementCandidate({ sourceState, candidate: tamperedCandidate }),
  error => error.code === 'GAMESTATE_CALENDAR_CANDIDATE_VERIFICATION_FAILED'
);

const wrongDateState = JSON.parse(JSON.stringify(candidate.state));
wrongDateState.meta.currentDate = '2027-03-06';
const wrongDateCandidate = Object.freeze({ ...candidate, state: wrongDateState });
assert.throws(
  () => verifyGameStateCalendarAdvancementCandidate({ sourceState, candidate: wrongDateCandidate }),
  error => error.code === 'GAMESTATE_CALENDAR_CANDIDATE_VERIFICATION_FAILED'
);

assert.throws(
  () => verifyGameStateCalendarAdvancementCandidate({ sourceState: {}, candidate }),
  error => error.code === 'GAMESTATE_CALENDAR_CANDIDATE_VERIFICATION_FAILED'
);

console.log('GameState calendar candidate verification tests passed.');
