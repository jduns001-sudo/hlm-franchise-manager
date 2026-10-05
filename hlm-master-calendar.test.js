'use strict';
const assert = require('assert');
const { assertIsoDate, addCalendarDays, createMasterCalendar } = require('./hlm-master-calendar');

assert.strictEqual(assertIsoDate('2026-10-05'), '2026-10-05');
assert.throws(() => assertIsoDate('10/05/2026'), e => e.code === 'INVALID_CALENDAR_DATE');
assert.throws(() => assertIsoDate('2026-02-30'), e => e.code === 'INVALID_CALENDAR_DATE');

assert.strictEqual(addCalendarDays('2026-10-31', 1), '2026-11-01');
assert.strictEqual(addCalendarDays('2027-02-28', 1), '2027-03-01');
assert.strictEqual(addCalendarDays('2028-02-28', 1), '2028-02-29');
assert.strictEqual(addCalendarDays('2028-02-29', 1), '2028-03-01');
assert.strictEqual(addCalendarDays('2026-12-31', 1), '2027-01-01');

const calendar = createMasterCalendar({ currentDate: '2026-10-05' });
const next = calendar.advanceDays();
const week = calendar.advanceDays(7);
assert.strictEqual(calendar.kind, 'master-hockey-calendar');
assert.strictEqual(calendar.version, 1);
assert.strictEqual(calendar.currentDate, '2026-10-05');
assert.strictEqual(next.currentDate, '2026-10-06');
assert.strictEqual(week.currentDate, '2026-10-12');
assert.notStrictEqual(next, calendar, 'advancement must return a new immutable calendar');
assert.strictEqual(Object.isFrozen(calendar), true);
assert.throws(() => calendar.advanceDays(0), e => e.code === 'INVALID_CALENDAR_ADVANCE');
assert.throws(() => calendar.advanceDays(1.5), e => e.code === 'INVALID_CALENDAR_ADVANCE');

console.log('Master calendar foundation tests passed.');
