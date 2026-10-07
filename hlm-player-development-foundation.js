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

  const snapshot = {
    playerId: Number(player.id),
    currentDate,
    age: calculateAge(player.birthYear, currentDate),
    birthYear: Number.isSafeInteger(Number(player.birthYear)) ? Number(player.birthYear) : null,
    overall: Number.isFinite(Number(player.ovr)) ? Number(player.ovr) : null,
    attributes: clone(player.attributes || null),
    potential: player.potential ?? null,
    potentialLevel: player.potentialLevel ?? player.potentialChance ?? player.chanceToReachPotential ?? null,
    developmentTraits: clone(player.developmentTraits || null),
    position: player.position ?? player.pos ?? null,
    retired: player.retired === true
  };

  return Object.freeze(snapshot);
}

module.exports = { calculateAge, resolveDevelopmentInputs };
