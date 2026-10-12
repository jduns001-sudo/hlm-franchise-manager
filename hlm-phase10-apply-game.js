'use strict';
const {validateGameStateEnvelope}=require('./hlm-game-state');
const {simulateGameScore}=require('./hlm-phase10-game-simulator');

/**
 * Apply one deterministic game result to a cloned save.
 * The caller owns persistence and standings projection.
 */
function applyScheduledGame(state, gameId, seed) {
  const validation=validateGameStateEnvelope(state);
  if (!validation.valid) {
    const error=new Error('Invalid game state');
    error.code='INVALID_GAME_STATE';
    throw error;
  }
  if (gameId == null) throw new TypeError('Game id required');
  const nextState=JSON.parse(JSON.stringify(state));
  const matches=nextState.activity.games.filter(game=>game && String(game.id)===String(gameId));
  if (matches.length!==1) throw new Error('Scheduled game must exist exactly once');
  const game=matches[0];
  if (game.status!=='scheduled') throw new Error('Game already played or not scheduled');
  if (!nextState.universe.teams.some(team=>team && String(team.id)===String(game.homeTeamId)) ||
      !nextState.universe.teams.some(team=>team && String(team.id)===String(game.awayTeamId))) {
    throw new Error('Game references unknown team');
  }
  const result=simulateGameScore({gameId:game.id,homeTeamId:game.homeTeamId,awayTeamId:game.awayTeamId,seed});
  Object.assign(game,result);
  return {nextState,result};
}
module.exports={applyScheduledGame};
