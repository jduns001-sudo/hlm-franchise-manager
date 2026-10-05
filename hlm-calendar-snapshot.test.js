'use strict';
const assert = require('assert');
const { createMasterCalendar } = require('./hlm-master-calendar');
const { createSeasonPhaseTimeline } = require('./hlm-season-phase-timeline');
const { createCalendarEventIndex } = require('./hlm-calendar-event');
const { createCalendarSnapshot } = require('./hlm-calendar-snapshot');

const calendar = createMasterCalendar({ currentDate: '2027-03-05' });
const timeline = createSeasonPhaseTimeline({
  windows: [
    { phaseId: 'regular-season', startDate: '2026-10-06', endDate: '2027-04-17' }
  ]
});
const eventIndex = createCalendarEventIndex({
  events: [
    { id: 'deadline-2027', type: 'trade-deadline', date: '2027-03-05', important: true },
    { id: 'roster-check-2027', type: 'roster-check', date: '2027-03-05' },
    { id: 'lottery-2027', type: 'draft-lottery', date: '2027-05-10', important: true }
  ]
});

const snapshot = createCalendarSnapshot({ calendar, timeline, eventIndex });
assert.strictEqual(snapshot.kind, 'calendar-snapshot');
assert.strictEqual(snapshot.version, 1);
assert.strictEqual(snapshot.currentDate, '2027-03-05');
assert.strictEqual(snapshot.activePhase.id, 'regular-season');
assert.deepStrictEqual(snapshot.todaysEvents.map(item => item.id), ['deadline-2027', 'roster-check-2027']);
assert.strictEqual(snapshot.nextImportantEvent.id, 'lottery-2027');
assert.strictEqual(Object.isFrozen(snapshot), true);
assert.strictEqual(Object.isFrozen(snapshot.todaysEvents), true);

const gapSnapshot = createCalendarSnapshot({
  calendar: createMasterCalendar({ currentDate: '2027-09-01' }),
  timeline,
  eventIndex
});
assert.strictEqual(gapSnapshot.activePhase, null);
assert.deepStrictEqual(gapSnapshot.todaysEvents, []);
assert.strictEqual(gapSnapshot.nextImportantEvent, null);

assert.throws(() => createCalendarSnapshot({ timeline, eventIndex }), e => e.code === 'INVALID_CALENDAR_SNAPSHOT_SOURCE');
assert.throws(() => createCalendarSnapshot({ calendar, eventIndex }), e => e.code === 'INVALID_CALENDAR_SNAPSHOT_SOURCE');
assert.throws(() => createCalendarSnapshot({ calendar, timeline }), e => e.code === 'INVALID_CALENDAR_SNAPSHOT_SOURCE');

console.log('Calendar snapshot tests passed.');
