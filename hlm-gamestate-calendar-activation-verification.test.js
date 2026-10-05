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
const { createGameStateCalendarActivationAuthorization } = require('./hlm-gamestate-calendar-activation-authorization');
const { activateGameStateCalendarCandidate } = require('./hlm-gamestate-calendar-activation');
const { verifyIsolatedGameStateCalendarActivation } = require('./hlm-gamestate-calendar-activation-verification');

function buildActivation() {
  const sourceState = createGameStateEnvelope({
    meta: { saveId: 'save-1', currentDate: '2027-03-03' },
    players: [{ id: 'p1', name: 'Player One' }]
  });
  const sourceBefore = JSON.stringify(sourceState);
  const calendar = createMasterCalendar({ currentDate: sourceState.meta.currentDate });
  const timeline = createSeasonPhaseTimeline({
    windows: [{ phaseId: 'regular-season', startDate: '2026-10-06', endDate: '2027-04-17' }]
  });
  const eventIndex = createCalendarEventIndex({ events: [] });
  const plan = createCalendarAdvancementPlan({ calendar, timeline, eventIndex, days: 2 });
  const planAuthorization = createCalendarAdvancementAuthorization({ plan, approved: true });
  const result = executeIsolatedCalendarAdvancement({ calendar, plan, authorization: planAuthorization });
  const calendarVerification = verifyCalendarAdvancement({ plan, authorization: planAuthorization, result });
  const candidate = createGameStateCalendarAdvancementCandidate({ state: sourceState, verification: calendarVerification });
  const verification = verifyGameStateCalendarAdvancementCandidate({ sourceState, candidate });
  const authorization = createGameStateCalendarActivationAuthorization({ verification, approved: true });
  const activation = activateGameStateCalendarCandidate({ verification, authorization });
  return { sourceState, sourceBefore, activation };
}

const pipeline = buildActivation();
const result = verifyIsolatedGameStateCalendarActivation({ activation: pipeline.activation });
assert.strictEqual(result.kind, 'isolated-gamestate-calendar-activation-verification');
assert.strictEqual(result.verified, true);
assert.strictEqual(result.fromDate, '2027-03-03');
assert.strictEqual(result.toDate, '2027-03-05');
assert.strictEqual(result.activation, pipeline.activation);
assert.strictEqual(Object.isFrozen(result), true);
assert.strictEqual(JSON.stringify(pipeline.sourceState), pipeline.sourceBefore);

const copiedState = JSON.parse(JSON.stringify(pipeline.activation.state));
const copiedActivation = Object.freeze({ ...pipeline.activation, state: copiedState });
assert.throws(
  () => verifyIsolatedGameStateCalendarActivation({ activation: copiedActivation }),
  error => error.code === 'GAMESTATE_CALENDAR_ACTIVATION_VERIFICATION_FAILED'
);

const wrongDateActivation = Object.freeze({ ...pipeline.activation, toDate: '2027-03-06' });
assert.throws(
  () => verifyIsolatedGameStateCalendarActivation({ activation: wrongDateActivation }),
  error => error.code === 'GAMESTATE_CALENDAR_ACTIVATION_VERIFICATION_FAILED'
);

assert.throws(
  () => verifyIsolatedGameStateCalendarActivation({ activation: {} }),
  error => error.code === 'GAMESTATE_CALENDAR_ACTIVATION_VERIFICATION_FAILED'
);

console.log('Isolated GameState calendar activation verification tests passed.');
