'use strict';

/**
 * Phase 3 Mission 94: calendar advancement authorization.
 * Permission boundary only. Does not advance time or execute events.
 */

function authorizationError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function assertPlan(plan) {
  if (
    !plan ||
    plan.kind !== 'calendar-advancement-plan' ||
    plan.version !== 1 ||
    typeof plan.fromDate !== 'string' ||
    typeof plan.toDate !== 'string' ||
    !Number.isSafeInteger(plan.days) ||
    plan.days < 1 ||
    !Array.isArray(plan.crossedDates) ||
    !Array.isArray(plan.phaseChanges) ||
    !Array.isArray(plan.dueEvents)
  ) {
    throw authorizationError('INVALID_CALENDAR_ADVANCEMENT_AUTHORIZATION', 'A valid calendar advancement plan is required.');
  }
  return plan;
}

function createCalendarAdvancementAuthorization(input = {}) {
  const plan = assertPlan(input.plan);
  if (input.approved !== true) {
    throw authorizationError('CALENDAR_ADVANCEMENT_NOT_APPROVED', 'Calendar advancement requires explicit approval.');
  }

  return Object.freeze({
    kind: 'calendar-advancement-authorization',
    version: 1,
    approved: true,
    fromDate: plan.fromDate,
    toDate: plan.toDate,
    days: plan.days,
    plan
  });
}

function assertCalendarAdvancementAuthorized(plan, authorization) {
  const validatedPlan = assertPlan(plan);
  if (
    !authorization ||
    authorization.kind !== 'calendar-advancement-authorization' ||
    authorization.version !== 1 ||
    authorization.approved !== true ||
    authorization.plan !== validatedPlan ||
    authorization.fromDate !== validatedPlan.fromDate ||
    authorization.toDate !== validatedPlan.toDate ||
    authorization.days !== validatedPlan.days
  ) {
    throw authorizationError('CALENDAR_ADVANCEMENT_AUTHORIZATION_MISMATCH', 'Authorization does not match the exact calendar advancement plan.');
  }
  return true;
}

module.exports = {
  createCalendarAdvancementAuthorization,
  assertCalendarAdvancementAuthorized
};
