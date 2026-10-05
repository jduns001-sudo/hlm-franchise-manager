'use strict';
const assert = require('assert');
const { createMasterCalendar } = require('./hlm-master-calendar');
const { createSeasonPhaseTimeline } = require('./hlm-season-phase-timeline');
const { createCalendarEventIndex } = require('./hlm-calendar-event');
const { createNextEventCalendarAdvancementPlan } = require('./hlm-calendar-next-event-advancement-plan');

const calendar = createMasterCalendar({ currentDate: '2027-03-03' });
const timeline = createSeasonPhaseTimeline({
  windows: [
    { phaseId: 'regular-season', startDate: '2027-03-01', endDate: '2027-03-04' },
    { phaseId: 'trade-deadline', startDate: '2027-03-05', endDate: '2027-03-05' },
    { phaseId: 'regular-season', startDate: '2027-03-06', endDate: '2027-04-10' }
  ]
});
const eventIndex = createCalendarEventIndex({
  events: [
    { id: 'background-1', type: 'scouting-update', date: '2027-03-04' },
    { id: 'deadline', type: 'trade-deadline', date: '2027-03-05', important: true },
    { id: 'game-1', type: 'game', date: '2027-03-07', important: true }
  ]
});

const next = createNextEventCalendarAdvancementPlan({ calendar, timeline, eventIndex });
assert.strictEqual(next.kind, 'next-event-calendar-advancement-plan');
assert.strictEqual(next.version, 1);
assert.strictEqual(next.fromDate, '2027-03-03');
assert.strictEqual(next.toDate, '2027-03-04');
assert.strictEqual(next.days, 1);
assert.strictEqual(next.targetEvent.id, 'background-1');
assert.strictEqual(next.dueEvents.length, 1);
assert.strictEqual(next.advancement.kind, 'calendar-advancement-plan');
assert.strictEqual(Object.isFrozen(next), true);

const important = createNextEventCalendarAdvancementPlan({
  calendar, timeline, eventIndex, importantOnly: true
});
assert.strictEqual(important.toDate, '2027-03-05');
assert.strictEqual(important.days, 2);
assert.strictEqual(important.targetEvent.id, 'deadline');
assert.strictEqual(important.phaseChanges.length, 1);
assert.strictEqual(important.phaseChanges[0].toPhase.id, 'trade-deadline');
assert.deepStrictEqual(important.dueEvents.map(event => event.id), ['background-1', 'deadline']);

assert.throws(
  () => createNextEventCalendarAdvancementPlan({
    calendar: createMasterCalendar({ currentDate: '2027-03-07' }),
    timeline,
    eventIndex
  }),
  error => error.code === 'INVALID_NEXT_EVENT_CALENDAR_ADVANCEMENT_PLAN'
);

assert.throws(
  () => createNextEventCalendarAdvancementPlan({
    calendar,
    timeline,
    eventIndex: { ...eventIndex, kind: 'wrong-index' }
  }),
  error => error.code === 'INVALID_NEXT_EVENT_CALENDAR_ADVANCEMENT_PLAN'
);

console.log('Next-event calendar advancement plan tests passed.');
