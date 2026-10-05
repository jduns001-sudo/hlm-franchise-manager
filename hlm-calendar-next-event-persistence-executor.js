'use strict';

/**
 * Phase 3 Mission 138: isolated next-event persistence executor.
 * First controlled Next Event write boundary. Creates only a new isolated slot.
 */

const { validateGameStateEnvelope } = require('./hlm-game-state');
const { assertNextEventCalendarPersistenceExecutionAuthorized } = require('./hlm-calendar-next-event-persistence-execution-authorization');

function executionError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function executeIsolatedNextEventCalendarPersistence(input = {}) {
  const pkg = input.package;
  const authorization = input.authorization;
  const repository = input.repository;
  const slotId = typeof input.slotId === 'string' ? input.slotId.trim() : '';

  try {
    assertNextEventCalendarPersistenceExecutionAuthorized(pkg, authorization);
  } catch (_) {
    throw executionError('NEXT_EVENT_CALENDAR_PERSISTENCE_EXECUTION_NOT_AUTHORIZED',
      'Exact Mission 137 next-event persistence execution authorization is required.');
  }

  if (!repository || typeof repository.save !== 'function' || typeof repository.load !== 'function' ||
      typeof repository.has !== 'function' || typeof repository.remove !== 'function') {
    throw executionError('INVALID_NEXT_EVENT_CALENDAR_PERSISTENCE_REPOSITORY',
      'An isolated save repository is required.');
  }
  if (!slotId) {
    throw executionError('INVALID_NEXT_EVENT_CALENDAR_PERSISTENCE_SLOT', 'A target save slot is required.');
  }
  if (repository.has(slotId)) {
    throw executionError('NEXT_EVENT_CALENDAR_PERSISTENCE_TARGET_OCCUPIED',
      'Mission 138 refuses to replace an existing save slot.');
  }

  const candidateState = pkg.candidateState;
  if (!validateGameStateEnvelope(candidateState).valid ||
      candidateState.meta.currentDate !== pkg.toDate ||
      !pkg.targetEvent || pkg.targetEvent.date !== pkg.toDate ||
      authorization.targetEvent !== pkg.targetEvent) {
    throw executionError('INVALID_NEXT_EVENT_CALENDAR_PERSISTENCE_CANDIDATE',
      'Authorized next-event candidate GameState is invalid.');
  }

  try {
    repository.save(slotId, candidateState, { saveId: slotId }, { replace: false });
    const written = repository.load(slotId);
    if (!written || !written.state || !validateGameStateEnvelope(written.state).valid ||
        written.state.meta.currentDate !== pkg.toDate) {
      throw executionError('NEXT_EVENT_CALENDAR_PERSISTENCE_POST_WRITE_VERIFICATION_FAILED',
        'Persisted next-event GameState failed immediate verification.');
    }

    return Object.freeze({
      kind: 'isolated-next-event-calendar-persistence-execution',
      version: 1,
      executed: true,
      verified: true,
      rolledBack: false,
      slotId,
      fromDate: pkg.fromDate,
      toDate: pkg.toDate,
      targetEvent: pkg.targetEvent,
      package: pkg,
      authorization
    });
  } catch (error) {
    try {
      if (repository.has(slotId)) repository.remove(slotId);
    } catch (rollbackError) {
      error.rollbackError = rollbackError;
    }
    error.persistenceRolledBack = true;
    throw error;
  }
}

module.exports = { executeIsolatedNextEventCalendarPersistence };
