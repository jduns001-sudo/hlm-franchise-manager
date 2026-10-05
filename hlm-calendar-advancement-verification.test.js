'use strict';
const assert = require('assert');
const { createMasterCalendar } = require('./hlm-master-calendar');
const { createSeasonPhaseTimeline } = require('./hlm-season-phase-timeline');
const { createCalendarEventIndex } = require('./hlm-calendar-event');
const { createCalendarAdvancementPlan } = require('./hlm-calendar-advancement-plan');
const { createCalendarAdvancementAuthorization } = require('./hlm-calendar-advancement-authorization');
const { executeIsolatedCalendarAdvancement } = require('./hlm-calendar-advancement-execution');
const { verifyCalendarAdvancement } = require('./hlm-calendar-advancement-verification');

const calendar = createMasterCalendar({ currentDate: '2027-03-03' });
const timeline = createSeasonPhaseTimeline({
  windows: [{ phaseId: 'regular-season', startDate: '2026-10-06', endDate: '2027-04-17' }]
});
const eventIndex = createCalendarEventIndex({
  events: [{ id: 'deadline', type: 'trade-deadline', date: '2027-03-05', important: true }]
});
const plan = createCalendarAdvancementPlan({ calendar, timeline, eventIndex, days: 2 });
const authorization = createCalendarAdvancementAuthorization({ plan, approved: true });
const result = executeIsolatedCalendarAdvancement({ calendar, plan, authorization });

const verification = verifyCalendarAdvancement({ plan, authorization, result });
assert.strictEqual(verification.kind, 'calendar-advancement-verification');
assert.strictEqual(verification.verified, true);
assert.strictEqual(verification.fromDate, '2027-03-03');
assert.strictEqual(verification.toDate, '2027-03-05');
assert.strictEqual(verification.days, 2);
assert.strictEqual(verification.plan, plan);
assert.strictEqual(verification.authorization, authorization);
assert.strictEqual(verification.result, result);
assert.strictEqual(Object.isFrozen(verification), true);

const wrongCalendarResult = Object.freeze({
  ...result,
  calendar: createMasterCalendar({ currentDate: '2027-03-06' })
});
assert.throws(
  () => verifyCalendarAdvancement({ plan, authorization, result: wrongCalendarResult }),
  error => error.code === 'CALENDAR_ADVANCEMENT_VERIFICATION_FAILED'
);

const copiedEventsResult = Object.freeze({
  ...result,
  dueEvents: Object.freeze(result.dueEvents.slice())
});
assert.throws(
  () => verifyCalendarAdvancement({ plan, authorization, result: copiedEventsResult }),
  error => error.code === 'CALENDAR_ADVANCEMENT_VERIFICATION_FAILED'
);

assert.throws(
  () => verifyCalendarAdvancement({ plan, authorization, result: {} }),
  error => error.code === 'CALENDAR_ADVANCEMENT_VERIFICATION_FAILED'
);

console.log('Calendar advancement verification tests passed.');
