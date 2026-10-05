'use strict';

/**
 * Phase 3 Mission 127: isolated next-event calendar advancement execution.
 * Executes only the calendar movement authorized by Mission 126. Produces a
 * new calendar/result only. No GameState, persistence, event processing, or UI.
 */

const { assertNextEventCalendarAdvancementAuthorized } = require('./hlm-calendar-next-event-advancement-authorization');
const { executeIsolatedCalendarAdvancement } = require('./hlm-calendar-advancement-execution');

function executionError(message) {
  const error = new Error(message);
  error.code = 'NEXT_EVENT_CALENDAR_ADVANCEMENT_EXECUTION_FAILED';
  return error;
}

function executeIsolatedNextEventCalendarAdvancement(input = {}) {
  const calendar = input.calendar;
  const plan = input.plan;
  const authorization = input.authorization;

  try {
    assertNextEventCalendarAdvancementAuthorized(plan, authorization);
  } catch (_) {
    throw executionError('Next-event advancement is not authorized for the exact plan.');
  }

  if (!calendar || calendar.kind !== 'master-hockey-calendar' || typeof calendar.currentDate !== 'string') {
    throw executionError('A master hockey calendar is required.');
  }
  if (calendar.currentDate !== plan.fromDate) {
    throw executionError('Source calendar date does not match the authorized next-event plan.');
  }

  let advancementResult;
  try {
    advancementResult = executeIsolatedCalendarAdvancement({
      calendar,
      plan: plan.advancement,
      authorization: authorization.advancementAuthorization
    });
  } catch (_) {
    throw executionError('Underlying isolated calendar advancement failed.');
  }

  if (
    advancementResult.toDate !== plan.toDate ||
    advancementResult.calendar.currentDate !== plan.targetEvent.date ||
    advancementResult.dueEvents !== plan.dueEvents ||
    advancementResult.phaseChanges !== plan.phaseChanges
  ) {
    throw executionError('Underlying calendar result does not match the next-event target.');
  }

  return Object.freeze({
    kind: 'isolated-next-event-calendar-advancement-result',
    version: 1,
    executed: true,
    importantOnly: plan.importantOnly,
    fromDate: plan.fromDate,
    toDate: plan.toDate,
    days: plan.days,
    targetEvent: plan.targetEvent,
    calendar: advancementResult.calendar,
    dueEvents: plan.dueEvents,
    phaseChanges: plan.phaseChanges,
    plan,
    authorization,
    advancementResult
  });
}

module.exports = { executeIsolatedNextEventCalendarAdvancement };
