'use strict';
const {validateGameStateEnvelope}=require('./hlm-game-state');
const {assertIsoDate}=require('./hlm-master-calendar');
const {generateRoundRobinSchedule}=require('./hlm-phase10-season-schedule');
const {archiveCompletedSeason}=require('./hlm-phase10-season-history');
/** Archive a finished season, then generate the next regular season without losing history. */
function beginNextSeason(state,{completedSeasonId,nextSeasonStartDate,cycles=2}={}){
  if(!validateGameStateEnvelope(state).valid)throw new Error('Invalid franchise game state');
  assertIsoDate(nextSeasonStartDate);
  if(nextSeasonStartDate<=state.meta.currentDate)throw new Error('Next season must start after the current date');
  const archived=archiveCompletedSeason(state,completedSeasonId);
  const nextState=archived.nextState;
  const oldGames=nextState.activity.games;
  nextState.history.seasons[nextState.history.seasons.length-1].regularSeasonResults=JSON.parse(JSON.stringify(oldGames));
  const schedule=generateRoundRobinSchedule(nextState.universe.teams,nextSeasonStartDate,cycles);
  const priorIds=new Set(oldGames.map(g=>String(g.id)));
  const seasonPrefix=String(completedSeasonId)+'-next-';
  const games=schedule.map(g=>({...g,id:seasonPrefix+g.id}));
  if(games.some(g=>priorIds.has(String(g.id))))throw new Error('Generated schedule conflicts with previous game IDs');
  nextState.activity.games=games;
  nextState.meta.currentDate=nextSeasonStartDate;
  delete nextState.extensions.phase10Playoffs;
  return {nextState,archivedSeason:archived.record,scheduledGames:games.length};
}
module.exports={beginNextSeason};
