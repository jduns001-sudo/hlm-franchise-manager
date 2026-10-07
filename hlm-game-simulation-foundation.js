'use strict';

const { validateGameStateEnvelope } = require('./hlm-game-state');

function gameSimulationError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function clone(value) {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value));
}

const GAME_SIMULATION_MODES = Object.freeze(['quick-result', 'full-summary', 'full-game']);
const GAME_SIMULATION_LAYERS = Object.freeze(['pre-game', 'game', 'post-game']);

function findScheduledGame(state, gameId) {
  if (!validateGameStateEnvelope(state).valid) throw gameSimulationError('INVALID_GAME_SIMULATION_STATE', 'A valid GameState envelope is required.');
  const games = state.calendar && Array.isArray(state.calendar.games) ? state.calendar.games :
    state.universe && Array.isArray(state.universe.games) ? state.universe.games : [];
  const game = games.find(candidate => String(candidate.id) === String(gameId));
  if (!game) throw gameSimulationError('GAME_NOT_FOUND', 'Scheduled game not found.');
  return game;
}

function createGameSimulationInput(state, gameId, options = {}) {
  const game = findScheduledGame(state, gameId);
  const mode = GAME_SIMULATION_MODES.includes(options.mode) ? options.mode : 'quick-result';
  const homeTeamId = game.homeTeamId ?? game.homeTeam ?? null;
  const awayTeamId = game.awayTeamId ?? game.awayTeam ?? null;
  if (homeTeamId === null || awayTeamId === null || String(homeTeamId) === String(awayTeamId))
    throw gameSimulationError('INVALID_GAME_MATCHUP', 'Game requires two different teams.');

  return Object.freeze({
    kind: 'game-simulation-input',
    version: 1,
    gameId: game.id,
    date: game.date ?? null,
    mode,
    layers: GAME_SIMULATION_LAYERS,
    matchup: Object.freeze({ homeTeamId, awayTeamId }),
    inputs: Object.freeze({
      forwards: null, defense: null, goalies: null, specialTeams: null,
      coaching: null, chemistry: null, tactics: null, matchups: null, fatigue: null
    }),
    systems: Object.freeze({
      possession: false, zoneEntries: false, scoringChances: false, rushes: false,
      breakaways: false, rebounds: false, oneTimers: false, screens: false,
      deflections: false, shooting: false, goaltending: false, specialTeams: false,
      penalties: false, gameSituations: false, injuries: false, playerPerformance: false,
      momentumFromEvents: false
    }),
    outputs: Object.freeze({
      standardStatistics: null, advancedStatistics: null, playByPlay: null,
      injuries: null, postGameAnalysis: null, history: null
    }),
    deterministicSeed: options.deterministicSeed ?? null,
    simulationPerformed: false,
    persistencePerformed: false,
    sourceGame: clone(game)
  });
}

module.exports = { GAME_SIMULATION_MODES, GAME_SIMULATION_LAYERS, createGameSimulationInput };
