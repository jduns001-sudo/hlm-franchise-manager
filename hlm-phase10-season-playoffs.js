'use strict';
const {validateGameStateEnvelope}=require('./hlm-game-state');
const {calculateStandings}=require('./hlm-phase10-standings');
const {seedPlayoffs}=require('./hlm-phase10-playoffs');
const {createPlayoffBracket}=require('./hlm-phase10-playoff-bracket');

/**
 * Pure regular-season -> playoff transition.
 * Only scheduled regular-season games block qualification.
 */
function startSeasonPlayoffs(state,spots=4,bestOf=7){
  const validation=validateGameStateEnvelope(state);
  if(!validation.valid)throw new Error('Invalid franchise game state');
  if(!Array.isArray(state.universe.teams)||state.universe.teams.length<spots)throw new Error('Not enough teams for playoffs');
  const games=state.activity.games;
  if(games.some(g=>!g||!['scheduled','final'].includes(g.status)))throw new Error('Invalid regular-season game status');
  if(games.some(g=>g.status==='scheduled'))throw new Error('Regular season has unplayed games');
  if(games.length===0)throw new Error('Cannot qualify playoffs without regular-season games');
  const standings=calculateStandings(state.universe.teams,games);
  const seeds=seedPlayoffs(standings,spots);
  const bracket=createPlayoffBracket(seeds,bestOf);
  const nextState=JSON.parse(JSON.stringify(state));
  if(nextState.extensions.phase10Playoffs)throw new Error('Playoffs already initialized');
  nextState.extensions.phase10Playoffs=bracket;
  return {nextState,standings,seeds,bracket};
}
module.exports={startSeasonPlayoffs};
