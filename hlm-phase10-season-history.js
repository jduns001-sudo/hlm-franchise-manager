'use strict';
const {validateGameStateEnvelope}=require('./hlm-game-state');
const {calculateStandings}=require('./hlm-phase10-standings');
/** Archive a completed championship season once without modifying the input. */
function archiveCompletedSeason(state,seasonId){
  const validation=validateGameStateEnvelope(state);
  if(!validation.valid)throw new Error('Invalid franchise game state');
  if(typeof seasonId!=='string'||!seasonId.trim())throw new TypeError('Season ID is required');
  const bracket=state.extensions.phase10Playoffs;
  if(!bracket||bracket.status!=='complete'||bracket.championTeamId==null)throw new Error('Championship is not complete');
  if(state.activity.games.some(g=>g.status!=='final'))throw new Error('Regular season is not complete');
  if(state.history.seasons.some(s=>s.seasonId===seasonId))throw new Error('Season already archived');
  const standings=calculateStandings(state.universe.teams,state.activity.games);
  const record={seasonId,championTeamId:bracket.championTeamId,completedDate:state.meta.currentDate,standings,playoffRounds:JSON.parse(JSON.stringify(bracket.rounds)),regularSeasonGames:state.activity.games.length};
  const nextState=JSON.parse(JSON.stringify(state));
  nextState.history.seasons.push(record);
  return {nextState,record};
}
module.exports={archiveCompletedSeason};
