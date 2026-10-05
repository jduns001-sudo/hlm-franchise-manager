'use strict';

/**
 * Phase 3 Mission 134: next-event calendar persistence readiness.
 * Readiness only. Performs no persistence writes.
 */

const { validateGameStateEnvelope } = require('./hlm-game-state');

function readinessError(message) {
  const error = new Error(message);
  error.code = 'NEXT_EVENT_CALENDAR_PERSISTENCE_NOT_READY';
  return error;
}

function createNextEventCalendarPersistenceReadiness(input = {}) {
  const verification = input.verification;

  if (
    !verification ||
    verification.kind !== 'isolated-next-event-gamestate-calendar-activation-verification' ||
    verification.version !== 1 ||
    verification.verified !== true ||
    verification.targetEventMatched !== true ||
    verification.candidateIdentityPreserved !== true ||
    verification.authorizationLineageVerified !== true ||
    !verification.activation ||
    !verification.targetEvent
  ) {
    throw readinessError('A verified Mission 133 next-event GameState activation is required.');
  }

  const activation = verification.activation;
  if (
    activation.kind !== 'isolated-next-event-gamestate-calendar-activation' ||
    activation.version !== 1 ||
    activation.activated !== true ||
    activation.state !== verification.state ||
    activation.targetEvent !== verification.targetEvent ||
    activation.fromDate !== verification.fromDate ||
    activation.toDate !== verification.toDate ||
    verification.targetEvent.date !== verification.toDate ||
    !validateGameStateEnvelope(activation.state).valid ||
    activation.state.meta.currentDate !== verification.toDate
  ) {
    throw readinessError('Next-event activation is not eligible for persistence planning.');
  }

  return Object.freeze({
    kind: 'next-event-calendar-persistence-readiness',
    version: 1,
    ready: true,
    fromDate: verification.fromDate,
    toDate: verification.toDate,
    targetEvent: verification.targetEvent,
    verification,
    candidateState: activation.state,
    requirements: Object.freeze({
      explicitPersistenceAuthorizationRequired: true,
      verifyAfterWriteRequired: true,
      rollbackOnFailureRequired: true
    })
  });
}

module.exports = { createNextEventCalendarPersistenceReadiness };
