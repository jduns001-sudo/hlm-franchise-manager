'use strict';

/**
 * Phase 3 Mission 106: isolated calendar persistence executor.
 * First controlled write boundary for the Phase 3 calendar chain.
 * Writes only to an explicitly supplied repository and refuses occupied slots.
 */

const { validateGameStateEnvelope } = require('./hlm-game-state');
const { assertCalendarPersistenceExecutionAuthorized } = require('./hlm-calendar-persistence-execution-authorization');

function executionError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function executeIsolatedCalendarPersistence(input = {}) {
  const pkg = input.package;
  const authorization = input.authorization;
  const repository = input.repository;
  const slotId = typeof input.slotId === 'string' ? input.slotId.trim() : '';

  try {
    assertCalendarPersistenceExecutionAuthorized(pkg, authorization);
  } catch (_) {
    throw executionError(
      'CALENDAR_PERSISTENCE_EXECUTION_NOT_AUTHORIZED',
      'Exact calendar persistence execution authorization is required.'
    );
  }

  if (!repository || typeof repository.save !== 'function' || typeof repository.load !== 'function' ||
      typeof repository.has !== 'function' || typeof repository.remove !== 'function') {
    throw executionError('INVALID_CALENDAR_PERSISTENCE_REPOSITORY', 'An isolated save repository is required.');
  }
  if (!slotId) {
    throw executionError('INVALID_CALENDAR_PERSISTENCE_SLOT', 'A target save slot is required.');
  }
  if (repository.has(slotId)) {
    throw executionError(
      'CALENDAR_PERSISTENCE_TARGET_OCCUPIED',
      'Mission 106 refuses to replace an existing save slot.'
    );
  }

  const candidateState = pkg.candidateState;
  if (!validateGameStateEnvelope(candidateState).valid || candidateState.meta.currentDate !== pkg.toDate) {
    throw executionError('INVALID_CALENDAR_PERSISTENCE_CANDIDATE', 'Authorized candidate GameState is invalid.');
  }

  try {
    repository.save(slotId, candidateState, { saveId: slotId }, { replace: false });
    const written = repository.load(slotId);
    if (
      !written ||
      !written.state ||
      !validateGameStateEnvelope(written.state).valid ||
      written.state.meta.currentDate !== pkg.toDate
    ) {
      throw executionError(
        'CALENDAR_PERSISTENCE_POST_WRITE_VERIFICATION_FAILED',
        'Persisted calendar GameState failed verification.'
      );
    }

    return Object.freeze({
      kind: 'isolated-calendar-persistence-execution',
      version: 1,
      executed: true,
      verified: true,
      rolledBack: false,
      slotId,
      fromDate: pkg.fromDate,
      toDate: pkg.toDate,
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

module.exports = { executeIsolatedCalendarPersistence };
