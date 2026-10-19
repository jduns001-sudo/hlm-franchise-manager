'use strict';
const {executeControlledRosterGame}=require('./hlm-phase10-controlled-roster-game');
const {simulateExperimentalRosterPlayoffGame}=require('./hlm-phase10-roster-playoff-game');
const {calculateStandings}=require('./hlm-phase10-standings');
const {createPlayoffBracket}=require('./hlm-phase10-playoff-bracket');
const {previewRealUniverseRollover}=require('./hlm-phase11-real-universe-career-gate');
/** Pure sandbox orchestration. No official result, player stats or production persistence. */
function previewRosterCareer(state,{seasonId='2026-27',nextSeasonId='2027-28',nextStartDate='2027-10-01',seeds=[],offseason={}}={}){
 const original=JSON.stringify(state);
 let current=JSON.parse(original),regularGames=0,playoffGames=0;
 const scheduled=current.activity.games.filter(g=>g.status==='scheduled');
 if(!scheduled.length)throw Error('Scheduled games required');
 for(const game of scheduled){
  const step=executeControlledRosterGame(current,game.id,regularGames+100,{experimental:true});
  if(!step.applied)throw Error('Roster blocked: '+step.blockers.join(','));
  current=step.nextState;regularGames++;
 }
 const standings=calculateStandings(current.universe.teams,current.activity.games);
 const entrants=(seeds.length?seeds:standings.slice(0,4).map(s=>s.teamId)).map((teamId,i)=>({seed:i+1,teamId}));
 if(entrants.length!==4)throw Error('Four playoff entrants required');
 current.extensions.phase10Playoffs=createPlayoffBracket(entrants,7);
 while(current.extensions.phase10Playoffs.status==='active'){
  const step=simulateExperimentalRosterPlayoffGame(current,200+playoffGames);
  if(!step.advanced)throw Error('Roster playoff blocked: '+step.blockers.join(','));
  current=step.nextState;
  if(++playoffGames>21)throw Error('Playoff safety limit');
 }
 const championTeamId=current.extensions.phase10Playoffs.championTeamId;
 current.history.seasons.push({seasonId,championTeamId,experimental:true});
 current.extensions.phase10CurrentSeasonId=seasonId;
 current.meta.currentDate='2027-06-01';
 const review=previewRealUniverseRollover(current,{...offseason,nextSeason:{completedSeasonId:seasonId,nextSeasonId,startDate:nextStartDate,cycles:2}});
 if(!review.ready)throw Error('Rollover continuity blocked: '+review.issues.join(','));
 if(JSON.stringify(state)!==original)throw Error('Source state mutated');
 return {nextState:review.nextState,standings,regularGames,playoffGames,championTeamId,archivedSeasons:review.nextState.history.seasons.length,official:false,playerStatisticsCertified:false,persistencePerformed:false,activationEnabled:false};
}
module.exports={previewRosterCareer};
