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
const { verifyIsolatedNextEventGameStateCalendarActivation } = require('./hlm-calendar-next-event-gamestate-activation-verification');

const state = createGameStateEnvelope({ meta: { currentDate: '2027-03-03', controlledTeamId: 'PIT' } });
const calendar = createMasterCalendar({ currentDate: state.meta.currentDate });
const timeline = createSeasonPhaseTimeline({ windows: [
  { phaseId: 'regular-season', startDate: '2027-03-01', endDate: '2027-03-10' }
]});
const eventIndex = createCalendarEventIndex({ events: [
  { id: 'game-1', type: 'game', date: '2027-03-05', important: true }
]});
const plan = createNextEventCalendarAdvancementPlan({ calendar, timeline, eventIndex, importantOnly: true });
const advanceAuth = createNextEventCalendarAdvancementAuthorization({ plan, approved: true });
const result = executeIsolatedNextEventCalendarAdvancement({ calendar, plan, authorization: advanceAuth });
const advanceVerify = verifyNextEventCalendarAdvancement({ plan, authorization: advanceAuth, result });
const candidate = createNextEventGameStateCalendarCandidate({ state, verification: advanceVerify });
const candidateVerify = verifyNextEventGameStateCalendarCandidate({ sourceState: state, candidate });
const activationAuth = createNextEventGameStateCalendarActivationAuthorization({ verification: candidateVerify, approved: true });
const activation = activateNextEventGameStateCalendarCandidate({ verification: candidateVerify, authorization: activationAuth });

const verification = verifyIsolatedNextEventGameStateCalendarActivation({ activation });
assert.strictEqual(verification.kind, 'isolated-next-event-gamestate-calendar-activation-verification');
assert.strictEqual(verification.verified, true);
assert.strictEqual(verification.targetEventMatched, true);
assert.strictEqual(verification.candidateIdentityPreserved, true);
assert.strictEqual(verification.authorizationLineageVerified, true);
assert.strictEqual(verification.activation, activation);
assert.strictEqual(verification.state, activation.state);
assert.strictEqual(verification.targetEvent, activation.targetEvent);
assert.strictEqual(verification.toDate, '2027-03-05');
assert.strictEqual(state.meta.currentDate, '2027-03-03');
assert.strictEqual(Object.isFrozen(verification), true);

assert.throws(() => verifyIsolatedNextEventGameStateCalendarActivation({
  activation: { ...activation, targetEvent: { ...activation.targetEvent } }
}), e => e.code === 'NEXT_EVENT_GAMESTATE_CALENDAR_ACTIVATION_VERIFICATION_FAILED');

assert.throws(() => verifyIsolatedNextEventGameStateCalendarActivation({
  activation: { ...activation, authorization: { ...activation.authorization } }
}), e => e.code === 'NEXT_EVENT_GAMESTATE_CALENDAR_ACTIVATION_VERIFICATION_FAILED');

assert.throws(() => verifyIsolatedNextEventGameStateCalendarActivation({
  activation: { ...activation, state: state }
}), e => e.code === 'NEXT_EVENT_GAMESTATE_CALENDAR_ACTIVATION_VERIFICATION_FAILED');

console.log('Isolated next-event GameState calendar activation verification tests passed.');
