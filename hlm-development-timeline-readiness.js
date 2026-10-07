'use strict';

const { validateGameStateEnvelope } = require('./hlm-game-state');

function readinessError(message) {
  const error = new Error(message);
  error.code = 'INVALID_DEVELOPMENT_TIMELINE_READINESS';
  return error;
}

function createDevelopmentTimelineReadiness(input = {}) {
  const state = input.state;
  if (!validateGameStateEnvelope(state).valid) throw readinessError('A valid GameState envelope is required.');

  const currentDate = state.meta.currentDate;
  const requestedDate = input.currentDate ?? currentDate;
  if (requestedDate !== currentDate) throw readinessError('Development evaluation date must match GameState current date.');

  const cadence = input.cadence ?? null;
  const due = input.due === true;

  return Object.freeze({
    kind: 'development-timeline-readiness',
    version: 1,
    currentDate,
    cadence,
    due,
    ready: due && cadence !== null,
    universeSystemsProcessed: false,
    persistencePerformed: false,
    state
  });
}

module.exports = { createDevelopmentTimelineReadiness };
