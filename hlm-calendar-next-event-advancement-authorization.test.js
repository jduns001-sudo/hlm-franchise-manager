'use strict';
const assert = require('assert');
const { createMasterCalendar } = require('./hlm-master-calendar');
const { createSeasonPhaseTimeline } = require('./hlm-season-phase-timeline');
const { createCalendarEventIndex } = require('./hlm-calendar-event');
const { createNextEventCalendarAdvancementPlan } = require('./hlm-calendar-next-event-advancement-plan');
const {
  createNextEventCalendarAdvancementAuthorization,
  assertNextEventCalendarAdvancementAuthorized
} = require('./hlm-calendar-next-event-advancement-authorization');

const calendar = createMasterCalendar({ currentDate: '2027-03-03' });
const timeline = createSeasonPhaseTimeline({
  windows: [{ phaseId: 'regular-season', startDate: '2027-03-01', endDate: '2027-04-10' }]
});
const eventIndex = createCalendarEventIndex({
  events: [
    { id: 'scout', type: 'scouting-update', date: '2027-03-04' },
    { id: 'game', type: 'game', date: '2027-03-05', important: true }
  ]
});
const plan = createNextEventCalendarAdvancementPlan({
  calendar, timeline, eventIndex, importantOnly: true
});

const authorization = createNextEventCalendarAdvancementAuthorization({
  plan,
  approved: true
});
assert.strictEqual(authorization.kind, 'next-event-calendar-advancement-authorization');
assert.strictEqual(authorization.version, 1);
assert.strictEqual(authorization.approved, true);
assert.strictEqual(authorization.plan, plan);
assert.strictEqual(authorization.targetEvent, plan.targetEvent);
assert.strictEqual(authorization.toDate, '2027-03-05');
assert.strictEqual(authorization.advancementAuthorization.plan, plan.advancement);
assert.strictEqual(Object.isFrozen(authorization), true);
assert.strictEqual(assertNextEventCalendarAdvancementAuthorized(plan, authorization), true);

assert.throws(
  () => createNextEventCalendarAdvancementAuthorization({ plan, approved: false }),
  error => error.code === 'NEXT_EVENT_CALENDAR_ADVANCEMENT_NOT_AUTHORIZED'
);

assert.throws(
  () => assertNextEventCalendarAdvancementAuthorized({ ...plan }, authorization),
  error => error.code === 'NEXT_EVENT_CALENDAR_ADVANCEMENT_NOT_AUTHORIZED'
);

assert.throws(
  () => assertNextEventCalendarAdvancementAuthorized(plan, {
    ...authorization,
    targetEvent: { ...plan.targetEvent }
  }),
  error => error.code === 'NEXT_EVENT_CALENDAR_ADVANCEMENT_NOT_AUTHORIZED'
);

assert.throws(
  () => assertNextEventCalendarAdvancementAuthorized(plan, {
    ...authorization,
    advancementAuthorization: {
      ...authorization.advancementAuthorization,
      plan: { ...plan.advancement }
    }
  }),
  error => error.code === 'NEXT_EVENT_CALENDAR_ADVANCEMENT_NOT_AUTHORIZED'
);

console.log('Next-event calendar advancement authorization tests passed.');
