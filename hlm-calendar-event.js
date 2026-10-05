'use strict';

/**
 * Phase 3 Mission 91: calendar event model.
 * Read-only event identity and date queries only. No event execution,
 * simulation advancement, schedules, persistence mutation, or UI wiring.
 */

const { assertIsoDate } = require('./hlm-master-calendar');

function eventError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function assertEventId(value) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw eventError('INVALID_CALENDAR_EVENT_ID', 'Calendar event id is required.');
  }
  return value;
}

function assertEventType(value) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw eventError('INVALID_CALENDAR_EVENT_TYPE', 'Calendar event type is required.');
  }
  return value;
}

function createCalendarEvent(input = {}) {
  const id = assertEventId(input.id);
  const type = assertEventType(input.type);
  const date = assertIsoDate(input.date);
  const important = input.important === true;
  return Object.freeze({ kind: 'calendar-event', version: 1, id, type, date, important });
}

function createCalendarEventIndex(input = {}) {
  if (!Array.isArray(input.events)) {
    throw eventError('INVALID_CALENDAR_EVENTS', 'Calendar events must be an array.');
  }
  const events = input.events.map(createCalendarEvent).sort((a, b) =>
    a.date.localeCompare(b.date) || a.id.localeCompare(b.id)
  );
  const ids = new Set();
  for (const event of events) {
    if (ids.has(event.id)) {
      throw eventError('DUPLICATE_CALENDAR_EVENT_ID', 'Calendar event ids must be unique.');
    }
    ids.add(event.id);
  }
  const frozenEvents = Object.freeze(events.slice());
  return Object.freeze({
    kind: 'calendar-event-index',
    version: 1,
    events: frozenEvents,
    eventsOn(dateText) {
      const date = assertIsoDate(dateText);
      return Object.freeze(frozenEvents.filter(event => event.date === date));
    },
    nextImportantEvent(afterDate) {
      const date = assertIsoDate(afterDate);
      return frozenEvents.find(event => event.important && event.date > date) || null;
    }
  });
}

module.exports = { createCalendarEvent, createCalendarEventIndex };
