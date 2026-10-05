'use strict';
const assert = require('assert');
const { createMasterCalendar } = require('./hlm-master-calendar');
const { createSeasonPhaseTimeline } = require('./hlm-season-phase-timeline');
const { createCalendarEventIndex } = require('./hlm-calendar-event');
const { createNextEventCalendarAdvancementPlan } = require('./hlm-calendar-next-event-advancement-plan');
const { createNextEventCalendarAdvancementAuthorization } = require('./hlm-calendar-next-event-advancement-authorization');
const { executeIsolatedNextEventCalendarAdvancement } = require('./hlm-calendar-next-event-advancement-execution');
const { verifyNextEventCalendarAdvancement } = require('./hlm-calendar-next-event-advancement-verification');

const calendar = createMasterCalendar({ currentDate: '2027-03-03' });
const timeline = createSeasonPhaseTimeline({ windows: [
  { phaseId: 'regular-season', startDate: '2027-03-01', endDate: '2027-03-04' },
  { phaseId: 'trade-deadline', startDate: '2027-03-05', endDate: '2027-03-05' }
]});
const eventIndex = createCalendarEventIndex({ events: [
  { id: 'scout', type: 'scouting-update', date: '2027-03-04' },
  { id: 'deadline', type: 'trade-deadline', date: '2027-03-05', important: true }
]});
const plan = createNextEventCalendarAdvancementPlan({ calendar, timeline, eventIndex, importantOnly: true });
const authorization = createNextEventCalendarAdvancementAuthorization({ plan, approved: true });
const result = executeIsolatedNextEventCalendarAdvancement({ calendar, plan, authorization });
const verification = verifyNextEventCalendarAdvancement({ plan, authorization, result });

assert.strictEqual(verification.kind, 'next-event-calendar-advancement-verification');
assert.strictEqual(verification.verified, true);
assert.strictEqual(verification.targetEventReached, true);
assert.strictEqual(verification.lineageIntact, true);
assert.strictEqual(verification.targetEvent, plan.targetEvent);
assert.strictEqual(verification.result, result);
assert.strictEqual(verification.calendar.currentDate, '2027-03-05');
assert.strictEqual(verification.advancementVerification.verified, true);
assert.strictEqual(Object.isFrozen(verification), true);

assert.throws(() => verifyNextEventCalendarAdvancement({
  plan: { ...plan }, authorization, result
}), e => e.code === 'NEXT_EVENT_CALENDAR_ADVANCEMENT_VERIFICATION_FAILED');

assert.throws(() => verifyNextEventCalendarAdvancement({
  plan, authorization, result: { ...result, targetEvent: { ...result.targetEvent } }
}), e => e.code === 'NEXT_EVENT_CALENDAR_ADVANCEMENT_VERIFICATION_FAILED');

assert.throws(() => verifyNextEventCalendarAdvancement({
  plan, authorization,
  result: { ...result, calendar: createMasterCalendar({ currentDate: '2027-03-04' }) }
}), e => e.code === 'NEXT_EVENT_CALENDAR_ADVANCEMENT_VERIFICATION_FAILED');

assert.throws(() => verifyNextEventCalendarAdvancement({
  plan, authorization,
  result: { ...result, advancementResult: { ...result.advancementResult, dueEvents: [] } }
}), e => e.code === 'NEXT_EVENT_CALENDAR_ADVANCEMENT_VERIFICATION_FAILED');

console.log('Next-event calendar advancement verification tests passed.');
