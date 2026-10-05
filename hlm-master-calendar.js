'use strict';

/**
 * Phase 3 Mission 88: deterministic master-calendar foundation.
 * Pure date logic only. No schedules, games, standings, phase transitions,
 * persistence writes, or Front Office wiring.
 */

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function assertIsoDate(value) {
  if (typeof value !== 'string' || !ISO_DATE_PATTERN.test(value)) {
    const error = new Error('Calendar date must use YYYY-MM-DD.');
    error.code = 'INVALID_CALENDAR_DATE';
    throw error;
  }
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    const error = new Error('Calendar date is not a real Gregorian date.');
    error.code = 'INVALID_CALENDAR_DATE';
    throw error;
  }
  return value;
}

function addCalendarDays(dateText, days) {
  assertIsoDate(dateText);
  if (!Number.isSafeInteger(days)) {
    const error = new Error('Calendar day advancement must be a safe integer.');
    error.code = 'INVALID_CALENDAR_ADVANCE';
    throw error;
  }
  const [year, month, day] = dateText.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function createMasterCalendar(input = {}) {
  const currentDate = assertIsoDate(input.currentDate);
  return Object.freeze({
    kind: 'master-hockey-calendar',
    version: 1,
    currentDate,
    advanceDays(days = 1) {
      if (!Number.isSafeInteger(days) || days < 1) {
        const error = new Error('Calendar must advance by at least one whole day.');
        error.code = 'INVALID_CALENDAR_ADVANCE';
        throw error;
      }
      return createMasterCalendar({ currentDate: addCalendarDays(currentDate, days) });
    }
  });
}

module.exports = { assertIsoDate, addCalendarDays, createMasterCalendar };
