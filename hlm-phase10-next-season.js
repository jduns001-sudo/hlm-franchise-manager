'use strict';
const {validateGameStateEnvelope}=require('./hlm-game-state');
const {assertIsoDate}=require('./hlm-master-calendar');
const {generateRoundRobinSchedule}=require('./hlm-phase10-season-schedule');
/**
 * Start a new regular season only after the prior championship has been archived.
 * Preserves rosters, contracts, franchise history and the input save unchanged.
 * Does not perform draft, free agency or contract expiration.
 */
function beginNextSeason(state,{completedSeasonId,nextSeasonId,startDate,cycles=2}={}){
  if(!validateGameStateEnvelope(state).valid)throw new Error('Invalid franchise game state');
  if(typeof completedSeasonId!=='string'||!completedSeasonId.trim())throw new TypeError('Completed season ID is required');
  if(typeof nextSeasonId!=='string'||!nextSeasonId.trim()||nextSeasonId===completedSeasonId)throw new TypeError('Distinct next season ID is required');
  assertIsoDate(startDate);
  if(!state.history.seasons.some(s=>s.seasonId===completedSeasonId))throw new Error('Previous championship must be archived');
  if(state.history.seasons.some(s=>s.seasonId===nextSeasonId))throw new Error('Next season already archived');
  if(state.extensions.phase10CurrentSeasonId===nextSeasonId)throw new Error('Next season already initialized');
  if(state.activity.games.some(g=>g.status!=='final'))throw new Error('Previous regular season is unfinished');
  if(!state.extensions.phase10Playoffs||state.extensions.phase10Playoffs.status!=='complete')throw new Error('Previous playoffs are unfinished');
  if(state.meta.currentDate&&startDate<=state.meta.currentDate)throw new Error('Next season must begin after championship date');
  const schedule=generateRoundRobinSchedule(state.universe.teams,startDate,cycles);
  const nextState=JSON.parse(JSON.stringify(state));
  nextState.activity.games=schedule;
  nextState.meta.currentDate=startDate;
  delete nextState.extensions.phase10Playoffs;
  nextState.extensions.phase10CurrentSeasonId=nextSeasonId;
  return {nextState,summary:{completedSeasonId,nextSeasonId,startDate,scheduledGames:schedule.length,archivedSeasons:nextState.history.seasons.length}};
}
module.exports={beginNextSeason};
