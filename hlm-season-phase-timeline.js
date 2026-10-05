'use strict';

/**
 * Phase 3 Mission 90: season phase timeline boundary.
 * Maps validated phase windows to calendar dates. Read-only lookup only.
 */

const { assertIsoDate } = require('./hlm-master-calendar');
const { createSeasonPhase } = require('./hlm-season-phase');

function timelineError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function createPhaseWindow(input = {}) {
  const phase = createSeasonPhase({ id: input.phaseId, custom: input.custom === true });
  const startDate = assertIsoDate(input.startDate);
  const endDate = assertIsoDate(input.endDate);
  if (endDate < startDate) {
    throw timelineError('INVALID_PHASE_WINDOW', 'Phase end date cannot precede its start date.');
  }
  return Object.freeze({
    phase,
    startDate,
    endDate
  });
}

function createSeasonPhaseTimeline(input = {}) {
  if (!Array.isArray(input.windows)) {
    throw timelineError('INVALID_PHASE_TIMELINE', 'Phase timeline windows must be an array.');
  }

  const windows = input.windows.map(createPhaseWindow).sort((a, b) =>
    a.startDate.localeCompare(b.startDate) || a.endDate.localeCompare(b.endDate)
  );

  for (let index = 1; index < windows.length; index += 1) {
    if (windows[index].startDate <= windows[index - 1].endDate) {
      throw timelineError('OVERLAPPING_PHASE_WINDOWS', 'Season phase windows cannot overlap.');
    }
  }

  const frozenWindows = Object.freeze(windows.slice());
  return Object.freeze({
    kind: 'season-phase-timeline',
    version: 1,
    windows: frozenWindows,
    phaseOn(dateText) {
      const date = assertIsoDate(dateText);
      const window = frozenWindows.find(item => item.startDate <= date && date <= item.endDate);
      return window ? window.phase : null;
    }
  });
}

module.exports = { createPhaseWindow, createSeasonPhaseTimeline };
