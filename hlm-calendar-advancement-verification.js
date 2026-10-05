'use strict';

/**
 * Phase 3 Mission 96: calendar advancement verification.
 * Independently verifies isolated execution against its exact authorized plan.
 */

const { assertCalendarAdvancementAuthorized } = require('./hlm-calendar-advancement-authorization');

function verificationError(message) {
  const error = new Error(message);
  error.code = 'CALENDAR_ADVANCEMENT_VERIFICATION_FAILED';
  return error;
}

function verifyCalendarAdvancement(input = {}) {
  const plan = input.plan;
  const authorization = input.authorization;
  const result = input.result;

  assertCalendarAdvancementAuthorized(plan, authorization);

  if (
    !result ||
    result.kind !== 'isolated-calendar-advancement-result' ||
    result.version !== 1 ||
    !result.calendar ||
    result.calendar.kind !== 'master-hockey-calendar'
  ) {
    throw verificationError('A valid isolated calendar advancement result is required.');
  }

  if (
    result.fromDate !== plan.fromDate ||
    result.toDate !== plan.toDate ||
    result.days !== plan.days ||
    result.calendar.currentDate !== plan.toDate ||
    result.dueEvents !== plan.dueEvents ||
    result.phaseChanges !== plan.phaseChanges
  ) {
    throw verificationError('Calendar advancement result does not match the authorized plan.');
  }

  return Object.freeze({
    kind: 'calendar-advancement-verification',
    version: 1,
    verified: true,
    fromDate: plan.fromDate,
    toDate: plan.toDate,
    days: plan.days,
    plan,
    authorization,
    result
  });
}

module.exports = { verifyCalendarAdvancement };
