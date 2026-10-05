'use strict';

/**
 * Phase 3 Mission 125: next-event calendar advancement plan.
 * Pure planning only. Finds the next eligible event after the current date and
 * delegates deterministic date/phase/event crossing to the existing Mission 93
 * advancement planner. Performs no execution, persistence, or UI wiring.
 */

const { createCalendarAdvancementPlan } = require('./hlm-calendar-advancement-plan');

function planError(message) {
  const error = new Error(message);
  error.code = 'INVALID_NEXT_EVENT_CALENDAR_ADVANCEMENT_PLAN';
  return error;
}

function createNextEventCalendarAdvancementPlan(input = {}) {
  const calendar = input.calendar;
  const timeline = input.timeline;
  const eventIndex = input.eventIndex;
  const importantOnly = input.importantOnly === true;

  if (!calendar || calendar.kind !== 'master-hockey-calendar' || typeof calendar.currentDate !== 'string') {
    throw planError('A master hockey calendar is required.');
  }
  if (!timeline || timeline.kind !== 'season-phase-timeline' || typeof timeline.phaseOn !== 'function') {
    throw planError('A season phase timeline is required.');
  }
  if (!eventIndex || eventIndex.kind !== 'calendar-event-index' || !Array.isArray(eventIndex.events)) {
    throw planError('A calendar event index is required.');
  }

  const nextEvent = eventIndex.events.find(event =>
    event.date > calendar.currentDate && (!importantOnly || event.important === true)
  ) || null;

  if (!nextEvent) {
    throw planError(importantOnly
      ? 'No future important calendar event is available.'
      : 'No future calendar event is available.');
  }

  const from = new Date(calendar.currentDate + 'T00:00:00Z');
  const to = new Date(nextEvent.date + 'T00:00:00Z');
  const days = Math.round((to.getTime() - from.getTime()) / 86400000);
  if (!Number.isSafeInteger(days) || days < 1) {
    throw planError('Next event must occur after the current calendar date.');
  }

  const advancement = createCalendarAdvancementPlan({ calendar, timeline, eventIndex, days });

  return Object.freeze({
    kind: 'next-event-calendar-advancement-plan',
    version: 1,
    importantOnly,
    fromDate: advancement.fromDate,
    toDate: advancement.toDate,
    days: advancement.days,
    targetEvent: nextEvent,
    crossedDates: advancement.crossedDates,
    phaseChanges: advancement.phaseChanges,
    dueEvents: advancement.dueEvents,
    advancement
  });
}

module.exports = { createNextEventCalendarAdvancementPlan };
