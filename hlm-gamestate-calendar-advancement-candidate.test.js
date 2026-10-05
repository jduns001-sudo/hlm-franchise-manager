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

const state = createGameStateEnvelope({
  meta: { saveId: 'save-1', controlledTeamId: 'PIT', currentDate: '2027-03-03' },
  players: [{ id: 'p1', name: 'Player One' }],
  teams: [{ id: 'PIT', name: 'Pittsburgh' }],
  contracts: [{ id: 'c1', playerId: 'p1' }],
  extensions: { marker: 'preserve-me' }
});
const calendar = createMasterCalendar({ currentDate: state.meta.currentDate });
const timeline = createSeasonPhaseTimeline({
  windows: [{ phaseId: 'regular-season', startDate: '2026-10-06', endDate: '2027-04-17' }]
});
const eventIndex = createCalendarEventIndex({ events: [] });
const plan = createCalendarAdvancementPlan({ calendar, timeline, eventIndex, days: 2 });
const authorization = createCalendarAdvancementAuthorization({ plan, approved: true });
const result = executeIsolatedCalendarAdvancement({ calendar, plan, authorization });
const verification = verifyCalendarAdvancement({ plan, authorization, result });

const before = JSON.stringify(state);
const candidate = createGameStateCalendarAdvancementCandidate({ state, verification });

assert.strictEqual(candidate.kind, 'gamestate-calendar-advancement-candidate');
assert.strictEqual(candidate.fromDate, '2027-03-03');
assert.strictEqual(candidate.toDate, '2027-03-05');
assert.strictEqual(candidate.state.meta.currentDate, '2027-03-05');
assert.strictEqual(state.meta.currentDate, '2027-03-03');
assert.strictEqual(JSON.stringify(state), before);
assert.notStrictEqual(candidate.state, state);
assert.notStrictEqual(candidate.state.meta, state.meta);
assert.deepStrictEqual(candidate.state.universe, state.universe);
assert.deepStrictEqual(candidate.state.assets, state.assets);
assert.deepStrictEqual(candidate.state.activity, state.activity);
assert.deepStrictEqual(candidate.state.history, state.history);
assert.deepStrictEqual(candidate.state.finances, state.finances);
assert.deepStrictEqual(candidate.state.extensions, state.extensions);
assert.strictEqual(candidate.verification, verification);
assert.strictEqual(Object.isFrozen(candidate), true);

const staleState = createGameStateEnvelope({ meta: { currentDate: '2027-03-04' } });
assert.throws(
  () => createGameStateCalendarAdvancementCandidate({ state: staleState, verification }),
  error => error.code === 'INVALID_GAMESTATE_CALENDAR_CANDIDATE'
);

assert.throws(
  () => createGameStateCalendarAdvancementCandidate({ state, verification: {} }),
  error => error.code === 'INVALID_GAMESTATE_CALENDAR_CANDIDATE'
);

assert.throws(
  () => createGameStateCalendarAdvancementCandidate({ state: {}, verification }),
  error => error.code === 'INVALID_GAMESTATE_CALENDAR_CANDIDATE'
);

console.log('GameState calendar advancement candidate tests passed.');
