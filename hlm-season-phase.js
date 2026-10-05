'use strict';

/**
 * Phase 3 Mission 89: season phase model.
 * Defines calendar phase identity only. No phase dates, transitions,
 * schedules, games, standings, playoff logic, persistence, or UI wiring.
 */

const SEASON_PHASES = Object.freeze({
  TRAINING_CAMP: 'training-camp',
  PRESEASON: 'preseason',
  REGULAR_SEASON: 'regular-season',
  TRADE_DEADLINE: 'trade-deadline',
  PLAYOFFS: 'playoffs',
  AWARDS: 'awards',
  DRAFT_LOTTERY: 'draft-lottery',
  DRAFT: 'draft',
  FREE_AGENCY: 'free-agency',
  OFFSEASON: 'offseason',
  INTERNATIONAL_BREAK: 'international-break',
  ALL_STAR_EVENT: 'all-star-event'
});

const STANDARD_SEASON_PHASES = Object.freeze(Object.values(SEASON_PHASES));

function isStandardSeasonPhase(value) {
  return typeof value === 'string' && STANDARD_SEASON_PHASES.includes(value);
}

function assertSeasonPhase(value, options = {}) {
  if (isStandardSeasonPhase(value)) return value;
  if (options.allowCustom === true && typeof value === 'string' && value.trim() !== '') {
    return value;
  }
  const error = new Error('Unknown season phase.');
  error.code = 'INVALID_SEASON_PHASE';
  throw error;
}

function createSeasonPhase(input = {}) {
  const id = assertSeasonPhase(input.id, { allowCustom: input.custom === true });
  const custom = !isStandardSeasonPhase(id);
  if (input.custom === true && !custom) {
    const error = new Error('Standard season phases cannot be marked custom.');
    error.code = 'INVALID_SEASON_PHASE';
    throw error;
  }
  return Object.freeze({
    kind: 'season-phase',
    version: 1,
    id,
    custom
  });
}

module.exports = {
  SEASON_PHASES,
  STANDARD_SEASON_PHASES,
  isStandardSeasonPhase,
  assertSeasonPhase,
  createSeasonPhase
};
