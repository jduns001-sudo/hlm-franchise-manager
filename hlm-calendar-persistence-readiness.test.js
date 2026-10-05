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
const { createCalendarPersistenceReadiness } = require('./hlm-calendar-persistence-readiness');

function buildVerification() {
  const sourceState = createGameStateEnvelope({ meta: { saveId: 'save-1', currentDate: '2027-03-03' } });
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
  const candidateVerification = verifyGameStateCalendarAdvancementCandidate({ sourceState, candidate });
  const activationAuthorization = createGameStateCalendarActivationAuthorization({
    verification: candidateVerification,
    approved: true
  });
  const activation = activateGameStateCalendarCandidate({
    verification: candidateVerification,
    authorization: activationAuthorization
  });
  return verifyIsolatedGameStateCalendarActivation({ activation });
}

const verification = buildVerification();
const readiness = createCalendarPersistenceReadiness({ verification });

assert.strictEqual(readiness.kind, 'calendar-persistence-readiness');
assert.strictEqual(readiness.version, 1);
assert.strictEqual(readiness.ready, true);
assert.strictEqual(readiness.fromDate, '2027-03-03');
assert.strictEqual(readiness.toDate, '2027-03-05');
assert.strictEqual(readiness.verification, verification);
assert.strictEqual(readiness.candidateState, verification.activation.state);
assert.strictEqual(readiness.requirements.explicitPersistenceAuthorizationRequired, true);
assert.strictEqual(readiness.requirements.verifyAfterWriteRequired, true);
assert.strictEqual(readiness.requirements.rollbackOnFailureRequired, true);
assert.strictEqual(Object.isFrozen(readiness), true);
assert.strictEqual(Object.isFrozen(readiness.requirements), true);

assert.throws(
  () => createCalendarPersistenceReadiness({ verification: { ...verification, verified: false } }),
  error => error.code === 'CALENDAR_PERSISTENCE_NOT_READY'
);

const copiedState = JSON.parse(JSON.stringify(verification.activation.state));
const substitutedActivation = { ...verification.activation, state: copiedState };
assert.throws(
  () => createCalendarPersistenceReadiness({ verification: { ...verification, activation: substitutedActivation } }),
  error => error.code === 'CALENDAR_PERSISTENCE_NOT_READY'
);

assert.throws(
  () => createCalendarPersistenceReadiness({ verification: {} }),
  error => error.code === 'CALENDAR_PERSISTENCE_NOT_READY'
);

console.log('Calendar persistence readiness tests passed.');
