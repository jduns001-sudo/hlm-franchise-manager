'use strict';

/**
 * Phase 3 Mission 93: calendar advancement plan.
 * Pure planning only. Does not mutate the calendar or execute events.
 */

const { addCalendarDays } = require('./hlm-master-calendar');

function planError(message) {
  const error = new Error(message);
  error.code = 'INVALID_CALENDAR_ADVANCEMENT_PLAN';
  return error;
}

function createCalendarAdvancementPlan(input = {}) {
  const calendar = input.calendar;
  const timeline = input.timeline;
  const eventIndex = input.eventIndex;
  const days = input.days === undefined ? 1 : input.days;

  if (!calendar || calendar.kind !== 'master-hockey-calendar' || typeof calendar.currentDate !== 'string') {
    throw planError('A master hockey calendar is required.');
  }
  if (!timeline || timeline.kind !== 'season-phase-timeline' || typeof timeline.phaseOn !== 'function') {
    throw planError('A season phase timeline is required.');
  }
  if (!eventIndex || eventIndex.kind !== 'calendar-event-index' || typeof eventIndex.eventsOn !== 'function') {
    throw planError('A calendar event index is required.');
  }
  if (!Number.isSafeInteger(days) || days < 1) {
    throw planError('Calendar advancement must be at least one whole day.');
  }

  const fromDate = calendar.currentDate;
  const toDate = addCalendarDays(fromDate, days);
  const crossedDates = [];
  const phaseChanges = [];
  const dueEvents = [];
  let previousPhase = timeline.phaseOn(fromDate);

  for (let offset = 1; offset <= days; offset += 1) {
    const date = addCalendarDays(fromDate, offset);
    crossedDates.push(date);

    const phase = timeline.phaseOn(date);
    const previousId = previousPhase ? previousPhase.id : null;
    const phaseId = phase ? phase.id : null;
    if (phaseId !== previousId) {
      phaseChanges.push(Object.freeze({ date, fromPhase: previousPhase, toPhase: phase }));
    }
    previousPhase = phase;

    for (const event of eventIndex.eventsOn(date)) {
      dueEvents.push(event);
    }
  }

  return Object.freeze({
    kind: 'calendar-advancement-plan',
    version: 1,
    fromDate,
    toDate,
    days,
    crossedDates: Object.freeze(crossedDates),
    phaseChanges: Object.freeze(phaseChanges),
    dueEvents: Object.freeze(dueEvents)
  });
}

module.exports = { createCalendarAdvancementPlan };
