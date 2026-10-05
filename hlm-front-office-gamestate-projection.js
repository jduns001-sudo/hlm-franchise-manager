'use strict';

const { validateGameStateEnvelope } = require('./hlm-game-state');

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function projectGameStateForFrontOffice(state) {
  const validation = validateGameStateEnvelope(state);
  if (!validation.valid) {
    const error = new Error('Valid central GameState is required for Front Office projection');
    error.code = 'INVALID_GAMESTATE_PROJECTION_SOURCE';
    error.validationErrors = validation.errors;
    throw error;
  }

  return Object.freeze({
    players: clone(state.universe.players),
    teams: clone(state.universe.teams),
    leagues: clone(state.universe.leagues),
    prospects: clone(state.universe.prospects),
    staff: clone(state.universe.staff),
    contracts: clone(state.assets.contracts),
    draftPicks: clone(state.assets.draftPicks),
    transactions: clone(state.activity.transactions),
    games: clone(state.activity.games),
    injuries: clone(state.activity.injuries),
    seasons: clone(state.history.seasons),
    statistics: clone(state.history.statistics),
    history: clone(state.history.records),
    finances: clone(state.finances),
    extensions: clone(state.extensions),
    settings: Object.freeze({
      controlledTeamId: state.meta.controlledTeamId
    }),
    gmSettings: Object.freeze({
      controlledTeamId: state.meta.controlledTeamId
    }),
    gameStateMeta: clone(state.meta),
    gameStateSchemaVersion: state.schemaVersion
  });
}

module.exports = { projectGameStateForFrontOffice };
