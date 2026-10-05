'use strict';

/**
 * Phase 3 Mission 92: calendar snapshot.
 * Read-only composition of existing calendar authorities.
 */

function snapshotError(message) {
  const error = new Error(message);
  error.code = 'INVALID_CALENDAR_SNAPSHOT_SOURCE';
  return error;
}

function createCalendarSnapshot(input = {}) {
  const calendar = input.calendar;
  const timeline = input.timeline;
  const eventIndex = input.eventIndex;

  if (!calendar || calendar.kind !== 'master-hockey-calendar' || typeof calendar.currentDate !== 'string') {
    throw snapshotError('A master hockey calendar is required.');
  }
  if (!timeline || timeline.kind !== 'season-phase-timeline' || typeof timeline.phaseOn !== 'function') {
    throw snapshotError('A season phase timeline is required.');
  }
  if (
    !eventIndex ||
    eventIndex.kind !== 'calendar-event-index' ||
    typeof eventIndex.eventsOn !== 'function' ||
    typeof eventIndex.nextImportantEvent !== 'function'
  ) {
    throw snapshotError('A calendar event index is required.');
  }

  const currentDate = calendar.currentDate;
  const activePhase = timeline.phaseOn(currentDate);
  const todaysEvents = eventIndex.eventsOn(currentDate);
  const nextImportantEvent = eventIndex.nextImportantEvent(currentDate);

  return Object.freeze({
    kind: 'calendar-snapshot',
    version: 1,
    currentDate,
    activePhase,
    todaysEvents,
    nextImportantEvent
  });
}

module.exports = { createCalendarSnapshot };
