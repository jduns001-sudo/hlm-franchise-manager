'use strict';

function authorizationError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function assertExecutionPackage(pkg) {
  if (!pkg || pkg.kind !== 'next-event-calendar-persistence-execution-package' || pkg.version !== 1 ||
      pkg.packaged !== true || pkg.executable !== false || !pkg.targetEvent ||
      pkg.targetEvent.date !== pkg.toDate || !pkg.readiness || !pkg.authorization ||
      !pkg.candidateState || pkg.targetEvent !== pkg.readiness.targetEvent ||
      pkg.targetEvent !== pkg.authorization.targetEvent ||
      pkg.candidateState !== pkg.readiness.candidateState ||
      pkg.candidateState !== pkg.authorization.candidateState ||
      pkg.candidateState.meta?.currentDate !== pkg.toDate ||
      pkg.transaction?.verifyAfterWrite !== true ||
      pkg.transaction?.rollbackOnFailure !== true ||
      pkg.transaction?.executionAuthorizationRequired !== true) {
    throw authorizationError('INVALID_NEXT_EVENT_CALENDAR_PERSISTENCE_EXECUTION_AUTHORIZATION',
      'A valid non-executable Mission 136 next-event persistence package is required.');
  }
  return pkg;
}

function createNextEventCalendarPersistenceExecutionAuthorization(input = {}) {
  const pkg = assertExecutionPackage(input.package);
  if (input.approved !== true) {
    throw authorizationError('NEXT_EVENT_CALENDAR_PERSISTENCE_EXECUTION_NOT_APPROVED',
      'Next-event calendar persistence execution requires explicit approval.');
  }
  return Object.freeze({
    kind: 'next-event-calendar-persistence-execution-authorization',
    version: 1,
    approved: true,
    fromDate: pkg.fromDate,
    toDate: pkg.toDate,
    targetEvent: pkg.targetEvent,
    package: pkg,
    candidateState: pkg.candidateState
  });
}

function assertNextEventCalendarPersistenceExecutionAuthorized(pkg, authorization) {
  const validatedPackage = assertExecutionPackage(pkg);
  if (!authorization || authorization.kind !== 'next-event-calendar-persistence-execution-authorization' ||
      authorization.version !== 1 || authorization.approved !== true ||
      authorization.package !== validatedPackage ||
      authorization.targetEvent !== validatedPackage.targetEvent ||
      authorization.candidateState !== validatedPackage.candidateState ||
      authorization.fromDate !== validatedPackage.fromDate ||
      authorization.toDate !== validatedPackage.toDate) {
    throw authorizationError('NEXT_EVENT_CALENDAR_PERSISTENCE_EXECUTION_AUTHORIZATION_MISMATCH',
      'Execution authorization does not match the exact next-event persistence package.');
  }
  return true;
}

module.exports = { createNextEventCalendarPersistenceExecutionAuthorization, assertNextEventCalendarPersistenceExecutionAuthorized };
