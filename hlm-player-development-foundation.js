'use strict';

/**
 * Phase 4 Mission 226: read-only player-development foundation.
 *
 * Establishes the boundary between the unified GameState/Phase 3 calendar
 * and future development calculations. This module never mutates GameState
 * and does not apply progression, decline, potential changes, or retirement.
 */

const { assertIsoDate } = require('./hlm-master-calendar');

function developmentError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function clone(value) {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value));
}

function calculateAge(birthYear, currentDate) {
  const year = Number(birthYear);
  if (!Number.isSafeInteger(year) || year < 1800) return null;
  const currentYear = Number(currentDate.slice(0, 4));
  if (year > currentYear) return null;
  return currentYear - year;
}

const DEVELOPMENT_CURVES = Object.freeze(['early-bloomer', 'normal', 'late-bloomer', 'bust', 'elite']);

function normalizeDevelopmentCurve(value) {
  if (value === null || value === undefined || value === '') return null;
  const normalized = String(value).trim().toLowerCase().replace(/[ _]+/g, '-');
  return DEVELOPMENT_CURVES.includes(normalized) ? normalized : null;
}

const DEVELOPMENT_STAGES = Object.freeze(['development', 'prime', 'decline']);

function classifyDevelopmentStage(age, curve) {
  if (age === null || age === undefined || age === '') return null;
  if (!Number.isFinite(Number(age)) || Number(age) < 0) return null;
  const normalizedCurve = normalizeDevelopmentCurve(curve) || 'normal';
  const years = Number(age);
  const thresholds = {
    'early-bloomer': { prime: 23, decline: 29 },
    normal: { prime: 25, decline: 31 },
    'late-bloomer': { prime: 27, decline: 33 },
    bust: { prime: 24, decline: 29 },
    elite: { prime: 24, decline: 32 }
  }[normalizedCurve];
  if (years < thresholds.prime) return 'development';
  if (years < thresholds.decline) return 'prime';
  return 'decline';
}

const DEVELOPMENT_DIRECTIONS = Object.freeze(['growth', 'stable', 'decline']);

function classifyDevelopmentDirection(stage, retired = false) {
  if (retired === true) return null;
  if (stage === 'development') return 'growth';
  if (stage === 'prime') return 'stable';
  if (stage === 'decline') return 'decline';
  return null;
}

function normalizeDevelopmentFactor(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  return Math.max(0, Math.min(100, number));
}

function calculateDevelopmentFactorSignal(factors) {
  if (!factors || typeof factors !== 'object') return null;
  const keys = ['workEthic', 'coachability', 'discipline', 'confidence', 'consistency', 'adaptability', 'morale'];
  const values = keys.map(key => normalizeDevelopmentFactor(factors[key])).filter(value => value !== null);
  if (values.length === 0) return null;
  const score = values.reduce((sum, value) => sum + value, 0) / values.length;
  return Object.freeze({
    score: Number(score.toFixed(2)),
    sampleSize: values.length,
    availableFactors: Object.freeze(keys.filter(key => normalizeDevelopmentFactor(factors[key]) !== null))
  });
}

function findPlayer(state, playerId) {
  if (!state || typeof state !== 'object' || !state.universe || !Array.isArray(state.universe.players)) {
    throw developmentError('INVALID_GAME_STATE', 'Unified GameState with universe.players is required.');
  }
  const id = Number(playerId);
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw developmentError('INVALID_PLAYER_ID', 'A positive permanent Player ID is required.');
  }
  const matches = state.universe.players.filter(player => Number(player && player.id) === id);
  if (matches.length === 0) throw developmentError('PLAYER_NOT_FOUND', 'Player ID was not found in unified GameState.');
  if (matches.length > 1) throw developmentError('DUPLICATE_PLAYER_ID', 'Player ID must be unique in unified GameState.');
  return matches[0];
}

function resolveDevelopmentInputs(state, playerId) {
  const player = findPlayer(state, playerId);
  const currentDate = state.meta && state.meta.currentDate;
  try {
    assertIsoDate(currentDate);
  } catch (_) {
    throw developmentError('INVALID_DEVELOPMENT_DATE', 'GameState meta.currentDate must be a valid YYYY-MM-DD date.');
  }

  const developmentCurve = normalizeDevelopmentCurve(player.developmentCurve ?? (player.developmentTraits && player.developmentTraits.curve));
  const age = calculateAge(player.birthYear, currentDate);

  const developmentStage = classifyDevelopmentStage(age, developmentCurve);

  const factors = Object.freeze({
    workEthic: player.workEthic ?? (player.developmentTraits && player.developmentTraits.workEthic) ?? null,
    coachability: player.coachability ?? (player.developmentTraits && player.developmentTraits.coachability) ?? null,
    discipline: player.discipline ?? (player.developmentTraits && player.developmentTraits.discipline) ?? null,
    confidence: player.confidence ?? null,
    consistency: player.consistency ?? (player.developmentTraits && player.developmentTraits.consistency) ?? null,
    adaptability: player.adaptability ?? (player.developmentTraits && player.developmentTraits.adaptability) ?? null,
    iceTime: player.iceTime ?? null,
    role: player.role ?? null,
    training: clone(player.training || null),
    coaching: clone(player.coaching || null),
    performance: clone(player.performance || null),
    health: clone(player.health || null),
    injuries: clone((state.activity && Array.isArray(state.activity.injuries))
      ? state.activity.injuries.filter(injury => Number(injury && injury.playerId) === Number(player.id))
      : []),
    morale: player.morale ?? null,
    organization: clone(player.organization || null)
  });

  const snapshot = {
    playerId: Number(player.id),
    currentDate,
    age,
    birthYear: Number.isSafeInteger(Number(player.birthYear)) ? Number(player.birthYear) : null,
    overall: Number.isFinite(Number(player.ovr)) ? Number(player.ovr) : null,
    attributes: clone(player.attributes || null),
    potential: player.potential ?? null,
    potentialLevel: player.potentialLevel ?? player.potentialChance ?? player.chanceToReachPotential ?? null,
    developmentTraits: clone(player.developmentTraits || null),
    developmentCurve,
    developmentStage,
    developmentDirection: classifyDevelopmentDirection(developmentStage, player.retired === true),
    factors,
    factorSignal: calculateDevelopmentFactorSignal(factors),
    position: player.position ?? player.pos ?? null,
    retired: player.retired === true
  };

  return Object.freeze(snapshot);
}

module.exports = { DEVELOPMENT_CURVES, DEVELOPMENT_STAGES, DEVELOPMENT_DIRECTIONS, calculateAge, normalizeDevelopmentCurve, classifyDevelopmentStage, classifyDevelopmentDirection, normalizeDevelopmentFactor, calculateDevelopmentFactorSignal, resolveDevelopmentInputs };
