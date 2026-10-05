'use strict';

/**
 * Phase 3 Mission 126: next-event calendar advancement authorization.
 * Binds one exact Mission 125 next-event plan to the existing deterministic
 * calendar advancement authorization. Performs no advancement or persistence.
 */

const {
  createCalendarAdvancementAuthorization,
  assertCalendarAdvancementAuthorized
} = require('./hlm-calendar-advancement-authorization');

function authorizationError(message) {
  const error = new Error(message);
  error.code = 'NEXT_EVENT_CALENDAR_ADVANCEMENT_NOT_AUTHORIZED';
  return error;
}

function assertNextEventPlan(plan) {
  if (
    !plan ||
    plan.kind !== 'next-event-calendar-advancement-plan' ||
    plan.version !== 1 ||
    typeof plan.fromDate !== 'string' ||
    typeof plan.toDate !== 'string' ||
    !Number.isSafeInteger(plan.days) ||
    plan.days < 1 ||
    !plan.targetEvent ||
    plan.targetEvent.kind !== 'calendar-event' ||
    plan.targetEvent.date !== plan.toDate ||
    !plan.advancement ||
    plan.advancement.kind !== 'calendar-advancement-plan' ||
    plan.fromDate !== plan.advancement.fromDate ||
    plan.toDate !== plan.advancement.toDate ||
    plan.days !== plan.advancement.days ||
    plan.crossedDates !== plan.advancement.crossedDates ||
    plan.phaseChanges !== plan.advancement.phaseChanges ||
    plan.dueEvents !== plan.advancement.dueEvents
  ) {
    throw authorizationError('A valid exact Mission 125 next-event plan is required.');
  }
  return plan;
}

function createNextEventCalendarAdvancementAuthorization(input = {}) {
  const plan = assertNextEventPlan(input.plan);
  if (input.approved !== true) {
    throw authorizationError('Next-event calendar advancement requires explicit approval.');
  }

  const advancementAuthorization = createCalendarAdvancementAuthorization({
    plan: plan.advancement,
    approved: true
  });

  return Object.freeze({
    kind: 'next-event-calendar-advancement-authorization',
    version: 1,
    approved: true,
    importantOnly: plan.importantOnly,
    fromDate: plan.fromDate,
    toDate: plan.toDate,
    days: plan.days,
    targetEvent: plan.targetEvent,
    plan,
    advancementAuthorization
  });
}

function assertNextEventCalendarAdvancementAuthorized(plan, authorization) {
  const validatedPlan = assertNextEventPlan(plan);
  if (
    !authorization ||
    authorization.kind !== 'next-event-calendar-advancement-authorization' ||
    authorization.version !== 1 ||
    authorization.approved !== true ||
    authorization.plan !== validatedPlan ||
    authorization.targetEvent !== validatedPlan.targetEvent ||
    authorization.importantOnly !== validatedPlan.importantOnly ||
    authorization.fromDate !== validatedPlan.fromDate ||
    authorization.toDate !== validatedPlan.toDate ||
    authorization.days !== validatedPlan.days ||
    !authorization.advancementAuthorization
  ) {
    throw authorizationError('Authorization does not match the exact next-event plan.');
  }

  try {
    assertCalendarAdvancementAuthorized(
      validatedPlan.advancement,
      authorization.advancementAuthorization
    );
  } catch (_) {
    throw authorizationError('Underlying calendar advancement authorization is invalid.');
  }
  return true;
}

module.exports = {
  createNextEventCalendarAdvancementAuthorization,
  assertNextEventCalendarAdvancementAuthorized
};
