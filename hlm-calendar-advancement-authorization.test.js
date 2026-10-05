'use strict';
const assert = require('assert');
const { createMasterCalendar } = require('./hlm-master-calendar');
const { createSeasonPhaseTimeline } = require('./hlm-season-phase-timeline');
const { createCalendarEventIndex } = require('./hlm-calendar-event');
const { createCalendarAdvancementPlan } = require('./hlm-calendar-advancement-plan');
const {
  createCalendarAdvancementAuthorization,
  assertCalendarAdvancementAuthorized
} = require('./hlm-calendar-advancement-authorization');

const timeline = createSeasonPhaseTimeline({
  windows: [{ phaseId: 'regular-season', startDate: '2026-10-06', endDate: '2027-04-17' }]
});
const eventIndex = createCalendarEventIndex({
  events: [{ id: 'deadline', type: 'trade-deadline', date: '2027-03-05', important: true }]
});
const plan = createCalendarAdvancementPlan({
  calendar: createMasterCalendar({ currentDate: '2027-03-03' }),
  timeline,
  eventIndex,
  days: 2
});

assert.throws(
  () => createCalendarAdvancementAuthorization({ plan }),
  error => error.code === 'CALENDAR_ADVANCEMENT_NOT_APPROVED'
);

const authorization = createCalendarAdvancementAuthorization({ plan, approved: true });
assert.strictEqual(authorization.kind, 'calendar-advancement-authorization');
assert.strictEqual(authorization.approved, true);
assert.strictEqual(authorization.fromDate, '2027-03-03');
assert.strictEqual(authorization.toDate, '2027-03-05');
assert.strictEqual(authorization.days, 2);
assert.strictEqual(authorization.plan, plan);
assert.strictEqual(Object.isFrozen(authorization), true);
assert.strictEqual(assertCalendarAdvancementAuthorized(plan, authorization), true);

const replacementPlan = createCalendarAdvancementPlan({
  calendar: createMasterCalendar({ currentDate: '2027-03-03' }),
  timeline,
  eventIndex,
  days: 2
});
assert.throws(
  () => assertCalendarAdvancementAuthorized(replacementPlan, authorization),
  error => error.code === 'CALENDAR_ADVANCEMENT_AUTHORIZATION_MISMATCH'
);

const differentPlan = createCalendarAdvancementPlan({
  calendar: createMasterCalendar({ currentDate: '2027-03-03' }),
  timeline,
  eventIndex,
  days: 1
});
assert.throws(
  () => assertCalendarAdvancementAuthorized(differentPlan, authorization),
  error => error.code === 'CALENDAR_ADVANCEMENT_AUTHORIZATION_MISMATCH'
);

assert.throws(
  () => createCalendarAdvancementAuthorization({ plan: {}, approved: true }),
  error => error.code === 'INVALID_CALENDAR_ADVANCEMENT_AUTHORIZATION'
);

console.log('Calendar advancement authorization tests passed.');
