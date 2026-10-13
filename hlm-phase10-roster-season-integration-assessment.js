'use strict';
/**
 * Phase 10 integration diagnostics.
 * Read-only and advisory: an exhibition score is never an official result.
 */
const { simulateRosterWeightedExhibition } = require('./hlm-phase10-roster-weighted-exhibition');
const { calculateStandings } = require('./hlm-phase10-standings');
const { validateGameStateEnvelope } = require('./hlm-game-state');

function assessRosterSeasonSimulationIntegration(state, gameId, seed = 1) {
  const validation = validateGameStateEnvelope(state);
  if (!validation.valid) {
    const error = new Error('Invalid GameState');
    error.code = 'INVALID_FRANCHISE_BRIDGE_STATE';
    throw error;
  }
  const games = state.activity.games.filter(g => String(g.id) === String(gameId));
  if (games.length !== 1 || games[0].status !== 'scheduled') {
    const error = new Error('One scheduled game is required');
    error.code = 'INVALID_ROSTER_INTEGRATION_GAME';
    throw error;
  }
  const game = games[0];
  const exhibition = simulateRosterWeightedExhibition(state, game.homeTeamId, game.awayTeamId, seed);
  const standingsBefore = calculateStandings(state.universe.teams, state.activity.games);
  return {
    kind:'phase10-roster-season-integration-assessment',
    version:1, gameId:game.id, homeTeamId:game.homeTeamId,
    awayTeamId:game.awayTeamId, seed, exhibition,
    standingsBefore,
    blockers: exhibition.playable ? ['OFFICIAL_AUTHORIZATION_NOT_IMPLEMENTED'] : exhibition.blockers.slice(),
    canApplyOfficialResult:false, officialGameResult:null,
    sourceStateMutated:false, persistencePerformed:false
  };
}
module.exports = { assessRosterSeasonSimulationIntegration };
