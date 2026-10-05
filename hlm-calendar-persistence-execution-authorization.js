'use strict';

/**
 * Phase 3 Mission 105: calendar persistence execution authorization.
 * Authorizes one exact execution package. Performs no persistence writes.
 */

function authorizationError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function assertExecutionPackage(pkg) {
  if (
    !pkg ||
    pkg.kind !== 'calendar-persistence-execution-package' ||
    pkg.version !== 1 ||
    pkg.packaged !== true ||
    pkg.executable !== false ||
    !pkg.readiness ||
    !pkg.authorization ||
    !pkg.candidateState ||
    pkg.candidateState !== pkg.readiness.candidateState ||
    pkg.candidateState !== pkg.authorization.candidateState ||
    pkg.candidateState.meta?.currentDate !== pkg.toDate ||
    pkg.transaction?.verifyAfterWrite !== true ||
    pkg.transaction?.rollbackOnFailure !== true ||
    pkg.transaction?.executionAuthorizationRequired !== true
  ) {
    throw authorizationError(
      'INVALID_CALENDAR_PERSISTENCE_EXECUTION_AUTHORIZATION',
      'A valid non-executable calendar persistence package is required.'
    );
  }
  return pkg;
}

function createCalendarPersistenceExecutionAuthorization(input = {}) {
  const pkg = assertExecutionPackage(input.package);
  if (input.approved !== true) {
    throw authorizationError(
      'CALENDAR_PERSISTENCE_EXECUTION_NOT_APPROVED',
      'Calendar persistence execution requires explicit approval.'
    );
  }

  return Object.freeze({
    kind: 'calendar-persistence-execution-authorization',
    version: 1,
    approved: true,
    fromDate: pkg.fromDate,
    toDate: pkg.toDate,
    package: pkg,
    candidateState: pkg.candidateState
  });
}

function assertCalendarPersistenceExecutionAuthorized(pkg, authorization) {
  const validatedPackage = assertExecutionPackage(pkg);
  if (
    !authorization ||
    authorization.kind !== 'calendar-persistence-execution-authorization' ||
    authorization.version !== 1 ||
    authorization.approved !== true ||
    authorization.package !== validatedPackage ||
    authorization.candidateState !== validatedPackage.candidateState ||
    authorization.fromDate !== validatedPackage.fromDate ||
    authorization.toDate !== validatedPackage.toDate
  ) {
    throw authorizationError(
      'CALENDAR_PERSISTENCE_EXECUTION_AUTHORIZATION_MISMATCH',
      'Execution authorization does not match the exact persistence package.'
    );
  }
  return true;
}

module.exports = {
  createCalendarPersistenceExecutionAuthorization,
  assertCalendarPersistenceExecutionAuthorized
};
