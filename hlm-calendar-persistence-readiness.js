'use strict';

/**
 * Phase 3 Mission 102: calendar advancement persistence readiness.
 * Readiness only. This module performs no persistence writes.
 */

const { validateGameStateEnvelope } = require('./hlm-game-state');

function readinessError(message) {
  const error = new Error(message);
  error.code = 'CALENDAR_PERSISTENCE_NOT_READY';
  return error;
}

function createCalendarPersistenceReadiness(input = {}) {
  const verification = input.verification;
  if (
    !verification ||
    verification.kind !== 'isolated-gamestate-calendar-activation-verification' ||
    verification.version !== 1 ||
    verification.verified !== true ||
    !verification.activation
  ) {
    throw readinessError('A verified isolated GameState calendar activation is required.');
  }

  const activation = verification.activation;
  if (
    activation.kind !== 'isolated-gamestate-calendar-activation' ||
    activation.version !== 1 ||
    activation.activated !== true ||
    activation.state !== activation.verification?.candidate?.state ||
    verification.fromDate !== activation.fromDate ||
    verification.toDate !== activation.toDate ||
    !validateGameStateEnvelope(activation.state).valid ||
    activation.state.meta.currentDate !== verification.toDate
  ) {
    throw readinessError('Activation is not eligible for persistence planning.');
  }

  return Object.freeze({
    kind: 'calendar-persistence-readiness',
    version: 1,
    ready: true,
    fromDate: verification.fromDate,
    toDate: verification.toDate,
    verification,
    candidateState: activation.state,
    requirements: Object.freeze({
      explicitPersistenceAuthorizationRequired: true,
      verifyAfterWriteRequired: true,
      rollbackOnFailureRequired: true
    })
  });
}

module.exports = { createCalendarPersistenceReadiness };
