'use strict';
const assert = require('assert');
const { createMasterCalendar } = require('./hlm-master-calendar');
const { createSeasonPhaseTimeline } = require('./hlm-season-phase-timeline');
const { createCalendarEventIndex } = require('./hlm-calendar-event');
const { createCalendarAdvancementPlan } = require('./hlm-calendar-advancement-plan');
const { createCalendarAdvancementAuthorization } = require('./hlm-calendar-advancement-authorization');
const { executeIsolatedCalendarAdvancement } = require('./hlm-calendar-advancement-execution');

const sourceCalendar = createMasterCalendar({ currentDate: '2027-03-03' });
const timeline = createSeasonPhaseTimeline({
  windows: [{ phaseId: 'regular-season', startDate: '2026-10-06', endDate: '2027-04-17' }]
});
const eventIndex = createCalendarEventIndex({
  events: [{ id: 'deadline', type: 'trade-deadline', date: '2027-03-05', important: true }]
});
const plan = createCalendarAdvancementPlan({
  calendar: sourceCalendar,
  timeline,
  eventIndex,
  days: 2
});
const authorization = createCalendarAdvancementAuthorization({ plan, approved: true });

const result = executeIsolatedCalendarAdvancement({
  calendar: sourceCalendar,
  plan,
  authorization
});

assert.strictEqual(result.kind, 'isolated-calendar-advancement-result');
assert.strictEqual(result.fromDate, '2027-03-03');
assert.strictEqual(result.toDate, '2027-03-05');
assert.strictEqual(result.days, 2);
assert.strictEqual(result.calendar.kind, 'master-hockey-calendar');
assert.strictEqual(result.calendar.currentDate, '2027-03-05');
assert.notStrictEqual(result.calendar, sourceCalendar);
assert.strictEqual(sourceCalendar.currentDate, '2027-03-03');
assert.deepStrictEqual(result.dueEvents.map(event => event.id), ['deadline']);
assert.strictEqual(result.dueEvents, plan.dueEvents);
assert.strictEqual(result.phaseChanges, plan.phaseChanges);
assert.strictEqual(Object.isFrozen(result), true);
assert.strictEqual(Object.isFrozen(result.calendar), true);

const staleCalendar = createMasterCalendar({ currentDate: '2027-03-04' });
assert.throws(
  () => executeIsolatedCalendarAdvancement({ calendar: staleCalendar, plan, authorization }),
  error => error.code === 'CALENDAR_ADVANCEMENT_SOURCE_MISMATCH'
);

assert.throws(
  () => executeIsolatedCalendarAdvancement({ calendar: sourceCalendar, plan, authorization: {} }),
  error => error.code === 'CALENDAR_ADVANCEMENT_AUTHORIZATION_MISMATCH'
);

console.log('Isolated calendar advancement execution tests passed.');
