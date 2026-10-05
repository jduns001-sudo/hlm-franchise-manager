'use strict';
const assert = require('assert');
const { createMasterCalendar } = require('./hlm-master-calendar');
const { createSeasonPhaseTimeline } = require('./hlm-season-phase-timeline');
const { createCalendarEventIndex } = require('./hlm-calendar-event');
const { createCalendarAdvancementPlan } = require('./hlm-calendar-advancement-plan');

const calendar = createMasterCalendar({ currentDate: '2027-04-16' });
const timeline = createSeasonPhaseTimeline({
  windows: [
    { phaseId: 'regular-season', startDate: '2026-10-06', endDate: '2027-04-17' },
    { phaseId: 'playoffs', startDate: '2027-04-19', endDate: '2027-06-20' }
  ]
});
const eventIndex = createCalendarEventIndex({
  events: [
    { id: 'season-end', type: 'season-end', date: '2027-04-17', important: true },
    { id: 'playoffs-open', type: 'playoffs-open', date: '2027-04-19', important: true },
    { id: 'other-event', type: 'other', date: '2027-04-19' }
  ]
});

const plan = createCalendarAdvancementPlan({ calendar, timeline, eventIndex, days: 3 });
assert.strictEqual(plan.kind, 'calendar-advancement-plan');
assert.strictEqual(plan.fromDate, '2027-04-16');
assert.strictEqual(plan.toDate, '2027-04-19');
assert.deepStrictEqual(plan.crossedDates, ['2027-04-17', '2027-04-18', '2027-04-19']);
assert.deepStrictEqual(plan.phaseChanges.map(change => ({
  date: change.date,
  from: change.fromPhase && change.fromPhase.id,
  to: change.toPhase && change.toPhase.id
})), [
  { date: '2027-04-18', from: 'regular-season', to: null },
  { date: '2027-04-19', from: null, to: 'playoffs' }
]);
assert.deepStrictEqual(plan.dueEvents.map(event => event.id), ['season-end', 'other-event', 'playoffs-open']);
assert.strictEqual(calendar.currentDate, '2027-04-16');
assert.strictEqual(Object.isFrozen(plan), true);
assert.strictEqual(Object.isFrozen(plan.crossedDates), true);
assert.strictEqual(Object.isFrozen(plan.phaseChanges), true);
assert.strictEqual(Object.isFrozen(plan.dueEvents), true);

const oneDay = createCalendarAdvancementPlan({ calendar, timeline, eventIndex });
assert.strictEqual(oneDay.toDate, '2027-04-17');
assert.deepStrictEqual(oneDay.dueEvents.map(event => event.id), ['season-end']);

assert.throws(() => createCalendarAdvancementPlan({ timeline, eventIndex }), e => e.code === 'INVALID_CALENDAR_ADVANCEMENT_PLAN');
assert.throws(() => createCalendarAdvancementPlan({ calendar, eventIndex }), e => e.code === 'INVALID_CALENDAR_ADVANCEMENT_PLAN');
assert.throws(() => createCalendarAdvancementPlan({ calendar, timeline }), e => e.code === 'INVALID_CALENDAR_ADVANCEMENT_PLAN');
assert.throws(() => createCalendarAdvancementPlan({ calendar, timeline, eventIndex, days: 0 }), e => e.code === 'INVALID_CALENDAR_ADVANCEMENT_PLAN');

console.log('Calendar advancement plan tests passed.');
