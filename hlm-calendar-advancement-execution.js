'use strict';

/**
 * Phase 3 Mission 95: isolated calendar advancement execution.
 * Produces a new calendar only. No GameState, persistence, event execution, or UI.
 */

const { createMasterCalendar } = require('./hlm-master-calendar');
const { assertCalendarAdvancementAuthorized } = require('./hlm-calendar-advancement-authorization');

function executionError(message) {
  const error = new Error(message);
  error.code = 'CALENDAR_ADVANCEMENT_SOURCE_MISMATCH';
  return error;
}

function executeIsolatedCalendarAdvancement(input = {}) {
  const calendar = input.calendar;
  const plan = input.plan;
  const authorization = input.authorization;

  if (!calendar || calendar.kind !== 'master-hockey-calendar' || typeof calendar.currentDate !== 'string') {
    throw executionError('A master hockey calendar is required.');
  }

  assertCalendarAdvancementAuthorized(plan, authorization);

  if (calendar.currentDate !== plan.fromDate) {
    throw executionError('The source calendar date does not match the authorized plan.');
  }

  const advancedCalendar = createMasterCalendar({ currentDate: plan.toDate });

  return Object.freeze({
    kind: 'isolated-calendar-advancement-result',
    version: 1,
    fromDate: plan.fromDate,
    toDate: plan.toDate,
    days: plan.days,
    calendar: advancedCalendar,
    dueEvents: plan.dueEvents,
    phaseChanges: plan.phaseChanges
  });
}

module.exports = { executeIsolatedCalendarAdvancement };
