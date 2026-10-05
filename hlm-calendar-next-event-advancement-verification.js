'use strict';

const { assertNextEventCalendarAdvancementAuthorized } = require('./hlm-calendar-next-event-advancement-authorization');
const { verifyCalendarAdvancement } = require('./hlm-calendar-advancement-verification');

function verificationError(message) {
  const error = new Error(message);
  error.code = 'NEXT_EVENT_CALENDAR_ADVANCEMENT_VERIFICATION_FAILED';
  return error;
}

function verifyNextEventCalendarAdvancement(input = {}) {
  const plan = input.plan;
  const authorization = input.authorization;
  const result = input.result;

  try {
    assertNextEventCalendarAdvancementAuthorized(plan, authorization);
  } catch (_) {
    throw verificationError('Next-event authorization does not match the exact plan.');
  }

  if (!result || result.kind !== 'isolated-next-event-calendar-advancement-result' ||
      result.version !== 1 || result.executed !== true || !result.calendar ||
      result.calendar.kind !== 'master-hockey-calendar' || !result.advancementResult) {
    throw verificationError('A valid Mission 127 isolated next-event result is required.');
  }

  if (result.plan !== plan || result.authorization !== authorization ||
      result.targetEvent !== plan.targetEvent || result.importantOnly !== plan.importantOnly ||
      result.fromDate !== plan.fromDate || result.toDate !== plan.toDate ||
      result.days !== plan.days || result.calendar.currentDate !== plan.targetEvent.date ||
      result.dueEvents !== plan.dueEvents || result.phaseChanges !== plan.phaseChanges) {
    throw verificationError('Next-event execution does not match the exact authorized plan.');
  }

  let advancementVerification;
  try {
    advancementVerification = verifyCalendarAdvancement({
      plan: plan.advancement,
      authorization: authorization.advancementAuthorization,
      result: result.advancementResult
    });
  } catch (_) {
    throw verificationError('Underlying calendar advancement could not be independently verified.');
  }

  if (advancementVerification.toDate !== plan.toDate ||
      advancementVerification.result.calendar !== result.calendar) {
    throw verificationError('Underlying verified calendar does not match the next-event result.');
  }

  return Object.freeze({
    kind: 'next-event-calendar-advancement-verification',
    version: 1,
    verified: true,
    targetEventReached: true,
    lineageIntact: true,
    importantOnly: plan.importantOnly,
    fromDate: plan.fromDate,
    toDate: plan.toDate,
    days: plan.days,
    targetEvent: plan.targetEvent,
    plan,
    authorization,
    result,
    advancementVerification,
    calendar: result.calendar,
    dueEvents: plan.dueEvents,
    phaseChanges: plan.phaseChanges
  });
}

module.exports = { verifyNextEventCalendarAdvancement };
