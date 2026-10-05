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
  createGameStateCalendarActivationAuthorization,
  assertGameStateCalendarActivationAuthorized
} = require('./hlm-gamestate-calendar-activation-authorization');

function buildVerification() {
  const state = createGameStateEnvelope({ meta: { currentDate: '2027-03-03' } });
  const calendar = createMasterCalendar({ currentDate: state.meta.currentDate });
  const timeline = createSeasonPhaseTimeline({
    windows: [{ phaseId: 'regular-season', startDate: '2026-10-06', endDate: '2027-04-17' }]
  });
  const eventIndex = createCalendarEventIndex({ events: [] });
  const plan = createCalendarAdvancementPlan({ calendar, timeline, eventIndex, days: 2 });
  const planAuthorization = createCalendarAdvancementAuthorization({ plan, approved: true });
  const result = executeIsolatedCalendarAdvancement({ calendar, plan, authorization: planAuthorization });
  const advancementVerification = verifyCalendarAdvancement({ plan, authorization: planAuthorization, result });
  const candidate = createGameStateCalendarAdvancementCandidate({ state, verification: advancementVerification });
  return verifyGameStateCalendarAdvancementCandidate({ sourceState: state, candidate });
}

const verification = buildVerification();

assert.throws(
  () => createGameStateCalendarActivationAuthorization({ verification }),
  error => error.code === 'GAMESTATE_CALENDAR_ACTIVATION_NOT_APPROVED'
);

const authorization = createGameStateCalendarActivationAuthorization({ verification, approved: true });
assert.strictEqual(authorization.kind, 'gamestate-calendar-activation-authorization');
assert.strictEqual(authorization.approved, true);
assert.strictEqual(authorization.fromDate, '2027-03-03');
assert.strictEqual(authorization.toDate, '2027-03-05');
assert.strictEqual(authorization.verification, verification);
assert.strictEqual(Object.isFrozen(authorization), true);
assert.strictEqual(assertGameStateCalendarActivationAuthorized(verification, authorization), true);

const replacementVerification = buildVerification();
assert.throws(
  () => assertGameStateCalendarActivationAuthorized(replacementVerification, authorization),
  error => error.code === 'GAMESTATE_CALENDAR_ACTIVATION_AUTHORIZATION_MISMATCH'
);

assert.throws(
  () => createGameStateCalendarActivationAuthorization({ verification: {}, approved: true }),
  error => error.code === 'INVALID_GAMESTATE_CALENDAR_ACTIVATION_AUTHORIZATION'
);

console.log('GameState calendar activation authorization tests passed.');
