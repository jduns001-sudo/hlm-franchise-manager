'use strict';
const { validateGameStateEnvelope } = require('./hlm-game-state');
const { calculateStandings } = require('./hlm-phase10-standings');

/**
 * Pure official-result application primitive.
 * Caller must supply a validated, authorized final result from a trusted game engine.
 * Does NOT authorize games itself and must never be called with an exhibition preview.
 */
function applyValidatedOfficialGameResult(state, result, authorization) {
  if (!authorization || authorization.kind !== 'trusted-official-game-authorization' ||
      authorization.validated !== true || authorization.gameId !== result?.gameId) {
    const error = new Error('Trusted game authorization is required');
    error.code = 'OFFICIAL_RESULT_NOT_AUTHORIZED';
    throw error;
  }
  const validation = validateGameStateEnvelope(state);
  if (!validation.valid) {
    const error = new Error('Invalid GameState');
    error.code = 'INVALID_FRANCHISE_BRIDGE_STATE';
    throw error;
  }
  if (!result || result.status !== 'final' || result.official !== true ||
      !Number.isSafeInteger(result.homeGoals) || result.homeGoals < 0 ||
      !Number.isSafeInteger(result.awayGoals) || result.awayGoals < 0 ||
      result.homeGoals === result.awayGoals || typeof result.overtime !== 'boolean') {
    const error = new Error('Invalid official final result');
    error.code = 'INVALID_OFFICIAL_FINAL_RESULT';
    throw error;
  }
  const scheduled = state.activity.games.filter(game => String(game.id) === String(result.gameId));
  if (scheduled.length !== 1 || scheduled[0].status !== 'scheduled' ||
      String(scheduled[0].homeTeamId) !== String(result.homeTeamId) ||
      String(scheduled[0].awayTeamId) !== String(result.awayTeamId)) {
    const error = new Error('Scheduled game missing, already final or teams mismatch');
    error.code = 'OFFICIAL_GAME_SCHEDULE_MISMATCH';
    throw error;
  }
  const homeId = String(result.homeTeamId), awayId = String(result.awayTeamId);
  if (homeId === awayId || !state.universe.teams.some(t => String(t.id) === homeId) ||
      !state.universe.teams.some(t => String(t.id) === awayId)) {
    const error = new Error('Official game teams must exist and be distinct');
    error.code = 'INVALID_OFFICIAL_GAME_TEAMS';
    throw error;
  }
  const winner = result.homeGoals > result.awayGoals ? result.homeTeamId : result.awayTeamId;
  if (String(result.winnerTeamId) !== String(winner)) {
    const error = new Error('Winner does not match final score');
    error.code = 'INVALID_OFFICIAL_GAME_WINNER';
    throw error;
  }
  const nextState = JSON.parse(JSON.stringify(state));
  const game = nextState.activity.games.find(g => String(g.id) === String(result.gameId));
  Object.assign(game, {
    status:'final', homeGoals:result.homeGoals, awayGoals:result.awayGoals,
    overtime:result.overtime, winnerTeamId:winner
  });
  const standings = calculateStandings(nextState.universe.teams, nextState.activity.games);
  nextState.extensions.phase10Standings = standings;
  return { nextState, game: { ...game }, standings, sourceStateMutated:false, persistencePerformed:false };
}
module.exports = { applyValidatedOfficialGameResult };
