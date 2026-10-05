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
const {
  createGameStateCalendarActivationAuthorization
} = require('./hlm-gamestate-calendar-activation-authorization');
const { activateGameStateCalendarCandidate } = require('./hlm-gamestate-calendar-activation');

function buildPipeline() {
  const sourceState = createGameStateEnvelope({
    meta: { saveId: 'save-1', currentDate: '2027-03-03' },
    players: [{ id: 'p1', name: 'Player One' }]
  });
  const calendar = createMasterCalendar({ currentDate: sourceState.meta.currentDate });
  const timeline = createSeasonPhaseTimeline({
    windows: [{ phaseId: 'regular-season', startDate: '2026-10-06', endDate: '2027-04-17' }]
  });
  const eventIndex = createCalendarEventIndex({ events: [] });
  const plan = createCalendarAdvancementPlan({ calendar, timeline, eventIndex, days: 2 });
  const planAuthorization = createCalendarAdvancementAuthorization({ plan, approved: true });
  const result = executeIsolatedCalendarAdvancement({ calendar, plan, authorization: planAuthorization });
  const advancementVerification = verifyCalendarAdvancement({ plan, authorization: planAuthorization, result });
  const candidate = createGameStateCalendarAdvancementCandidate({
    state: sourceState,
    verification: advancementVerification
  });
  const verification = verifyGameStateCalendarAdvancementCandidate({ sourceState, candidate });
  const authorization = createGameStateCalendarActivationAuthorization({ verification, approved: true });
  return { sourceState, candidate, verification, authorization };
}

const pipeline = buildPipeline();
const before = JSON.stringify(pipeline.sourceState);
const activation = activateGameStateCalendarCandidate({
  verification: pipeline.verification,
  authorization: pipeline.authorization
});

assert.strictEqual(activation.kind, 'isolated-gamestate-calendar-activation');
assert.strictEqual(activation.activated, true);
assert.strictEqual(activation.fromDate, '2027-03-03');
assert.strictEqual(activation.toDate, '2027-03-05');
assert.strictEqual(activation.state, pipeline.candidate.state);
assert.strictEqual(activation.state.meta.currentDate, '2027-03-05');
assert.strictEqual(pipeline.sourceState.meta.currentDate, '2027-03-03');
assert.strictEqual(JSON.stringify(pipeline.sourceState), before);
assert.strictEqual(activation.verification, pipeline.verification);
assert.strictEqual(activation.authorization, pipeline.authorization);
assert.strictEqual(Object.isFrozen(activation), true);

const other = buildPipeline();
assert.throws(
  () => activateGameStateCalendarCandidate({
    verification: other.verification,
    authorization: pipeline.authorization
  }),
  error => error.code === 'GAMESTATE_CALENDAR_ACTIVATION_AUTHORIZATION_MISMATCH'
);

assert.throws(
  () => activateGameStateCalendarCandidate({ verification: pipeline.verification, authorization: {} }),
  error => error.code === 'GAMESTATE_CALENDAR_ACTIVATION_AUTHORIZATION_MISMATCH'
);

console.log('Isolated GameState calendar activation tests passed.');
