'use strict';
const assert = require('assert');
const { createCalendarEvent, createCalendarEventIndex } = require('./hlm-calendar-event');

const event = createCalendarEvent({
  id: 'trade-deadline-2027',
  type: 'trade-deadline',
  date: '2027-03-05',
  important: true
});
assert.strictEqual(event.kind, 'calendar-event');
assert.strictEqual(event.version, 1);
assert.strictEqual(event.important, true);
assert.strictEqual(Object.isFrozen(event), true);

const index = createCalendarEventIndex({
  events: [
    { id: 'draft-2027', type: 'draft', date: '2027-06-25', important: true },
    { id: 'all-star-2027', type: 'all-star-event', date: '2027-02-06' },
    { id: 'deadline-2027', type: 'trade-deadline', date: '2027-03-05', important: true },
    { id: 'lottery-2027', type: 'draft-lottery', date: '2027-05-10', important: true },
    { id: 'skills-2027', type: 'all-star-skills', date: '2027-02-06' }
  ]
});

assert.deepStrictEqual(index.events.map(item => item.id), [
  'all-star-2027', 'skills-2027', 'deadline-2027', 'lottery-2027', 'draft-2027'
]);
assert.deepStrictEqual(index.eventsOn('2027-02-06').map(item => item.id), [
  'all-star-2027', 'skills-2027'
]);
assert.strictEqual(index.nextImportantEvent('2027-02-06').id, 'deadline-2027');
assert.strictEqual(index.nextImportantEvent('2027-03-05').id, 'lottery-2027');
assert.strictEqual(index.nextImportantEvent('2027-06-25'), null);
assert.strictEqual(Object.isFrozen(index), true);
assert.strictEqual(Object.isFrozen(index.events), true);
assert.strictEqual(Object.isFrozen(index.eventsOn('2027-02-06')), true);

assert.throws(() => createCalendarEvent({ type: 'draft', date: '2027-06-25' }), e => e.code === 'INVALID_CALENDAR_EVENT_ID');
assert.throws(() => createCalendarEvent({ id: 'x', date: '2027-06-25' }), e => e.code === 'INVALID_CALENDAR_EVENT_TYPE');
assert.throws(() => createCalendarEventIndex({ events: [
  { id: 'same', type: 'draft', date: '2027-06-25' },
  { id: 'same', type: 'free-agency', date: '2027-07-01' }
] }), e => e.code === 'DUPLICATE_CALENDAR_EVENT_ID');

console.log('Calendar event model tests passed.');
