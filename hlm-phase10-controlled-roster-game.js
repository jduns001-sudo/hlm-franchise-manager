'use strict';
/**
 * Mission 742: one-step roster-driven game execution for explicit sandbox use.
 * NOT official league certification, player statistics, or disk persistence.
 * The caller must opt into experimental simulation. No caller-provided
 * authorization token is accepted or issued.
 */
const { validateGameStateEnvelope } = require('./hlm-game-state');
const { simulateRosterWeightedExhibition } = require('./hlm-phase10-roster-weighted-exhibition');
const { calculateStandings } = require('./hlm-phase10-standings');

function executeControlledRosterGame(state, gameId, seed = 1, options = {}) {
  if (!options || options.experimental !== true || options.persist === true) {
    const error = new Error('Explicit nonpersistent experimental mode required');
    error.code = 'CONTROLLED_ROSTER_GAME_NOT_ENABLED';
    throw error;
  }
  const validation = validateGameStateEnvelope(state);
  if (!validation.valid) {
    const error = new Error('Invalid GameState');
    error.code = 'INVALID_FRANCHISE_BRIDGE_STATE';
    throw error;
  }
  const matches = state.activity.games.filter(game => String(game.id) === String(gameId));
  if (matches.length !== 1 || matches[0].status !== 'scheduled') {
    const error = new Error('One unplayed scheduled game required');
    error.code = 'INVALID_CONTROLLED_ROSTER_GAME';
    throw error;
  }
  const scheduled = matches[0];
  const exhibition = simulateRosterWeightedExhibition(
    state, scheduled.homeTeamId, scheduled.awayTeamId, seed
  );
  if (!exhibition.playable) return {
    applied:false, blockers:exhibition.blockers.slice(), nextState:null,
    exhibition, official:false, persistencePerformed:false, sourceStateMutated:false
  };
  const nextState = JSON.parse(JSON.stringify(state));
  const game = nextState.activity.games.find(g => String(g.id) === String(gameId));
  Object.assign(game, {
    status:'final', homeGoals:exhibition.score.homeGoals,
    awayGoals:exhibition.score.awayGoals, overtime:exhibition.score.overtime,
    winnerTeamId:exhibition.score.winnerTeamId,
    simulationMode:'experimental-roster-weighted', official:false
  });
  const standings = calculateStandings(nextState.universe.teams, nextState.activity.games);
  nextState.extensions.phase10ExperimentalStandings = standings;
  return {
    applied:true, blockers:[], nextState, game:{...game}, standings,
    exhibition, official:false, persistencePerformed:false, sourceStateMutated:false
  };
}
module.exports = { executeControlledRosterGame };
