'use strict';
const {executeControlledRosterGame}=require('./hlm-phase10-controlled-roster-game');
const {simulateExperimentalRosterPlayoffGame}=require('./hlm-phase10-roster-playoff-game');
const {calculateStandings}=require('./hlm-phase10-standings');
const {createPlayoffBracket}=require('./hlm-phase10-playoff-bracket');
const {previewRealUniverseRollover}=require('./hlm-phase11-real-universe-career-gate');
const {buildExperimentalGoalEvents,aggregateExperimentalGoals}=require('./hlm-phase10-experimental-player-goals');
/** Pure sandbox orchestration. No official result, player stats or production persistence. */
function previewRosterCareer(state,{seasonId='2026-27',nextSeasonId='2027-28',nextStartDate='2027-10-01',seeds=[],offseason={}}={}){
 const original=JSON.stringify(state);
 let current=JSON.parse(original),regularGames=0,playoffGames=0;
 const ledger=Array.isArray(current.extensions.phase11ExperimentalCareerGoalEvents)?current.extensions.phase11ExperimentalCareerGoalEvents.slice():[];
 const seen=new Set(ledger.map(e=>String(e.seasonId)+'|'+String(e.stage)+'|'+String(e.gameId)+'|'+String(e.teamId)+'|'+String(e.sequence)));
 const append=(game,stage,seed)=>{
  const events=buildExperimentalGoalEvents(current,{...game,id:game.id??game.gameId},seed);
  for(const event of events){
   const row={...event,seasonId,stage};
   const key=String(seasonId)+'|'+stage+'|'+String(row.gameId)+'|'+String(row.teamId)+'|'+String(row.sequence);
   if(seen.has(key))throw Error('Duplicate career goal event: '+key);
   seen.add(key);ledger.push(row);
  }
 };
 const scheduled=current.activity.games.filter(g=>g.status==='scheduled');
 if(!scheduled.length)throw Error('Scheduled games required');
 for(const game of scheduled){
  const step=executeControlledRosterGame(current,game.id,regularGames+100,{experimental:true});
  if(!step.applied)throw Error('Roster blocked: '+step.blockers.join(','));
  current=step.nextState;append(step.game,'regular',regularGames+100);regularGames++;
 }
 const standings=calculateStandings(current.universe.teams,current.activity.games);
 const entrants=(seeds.length?seeds:standings.slice(0,4).map(s=>s.teamId)).map((teamId,i)=>({seed:i+1,teamId}));
 if(entrants.length!==4)throw Error('Four playoff entrants required');
 current.extensions.phase10Playoffs=createPlayoffBracket(entrants,7);
 while(current.extensions.phase10Playoffs.status==='active'){
  const step=simulateExperimentalRosterPlayoffGame(current,200+playoffGames);
  if(!step.advanced)throw Error('Roster playoff blocked: '+step.blockers.join(','));
  current=step.nextState;append(step.result,'playoff',200+playoffGames);
  if(++playoffGames>21)throw Error('Playoff safety limit');
 }
 const championTeamId=current.extensions.phase10Playoffs.championTeamId;
 current.extensions.phase11ExperimentalCareerGoalEvents=ledger;
 const seasonEvents=ledger.filter(e=>e.seasonId===seasonId);
 const regularEvents=seasonEvents.filter(e=>e.stage==='regular');
 const playoffEvents=seasonEvents.filter(e=>e.stage==='playoff');
 const regularGoals=current.activity.games.filter(g=>g.status==='final'&&scheduled.some(s=>String(s.id)===String(g.id))).reduce((n,g)=>n+g.homeGoals+g.awayGoals,0);
 const playoffGoals=current.extensions.phase10Playoffs.rounds.flatMap(round=>round.flatMap(series=>series.games)).reduce((n,g)=>n+g.homeGoals+g.awayGoals,0);
 if(regularEvents.length!==regularGoals||playoffEvents.length!==playoffGoals)throw Error('Career goals do not reconcile to scores');
 current.history.seasons.push({seasonId,championTeamId,experimental:true});
 current.extensions.phase10CurrentSeasonId=seasonId;
 current.meta.currentDate='2027-06-01';
 const review=previewRealUniverseRollover(current,{...offseason,nextSeason:{completedSeasonId:seasonId,nextSeasonId,startDate:nextStartDate,cycles:2}});
 if(!review.ready)throw Error('Rollover continuity blocked: '+review.issues.join(','));
 if(JSON.stringify(state)!==original)throw Error('Source state mutated');
 return {nextState:review.nextState,standings,regularGames,playoffGames,championTeamId,archivedSeasons:review.nextState.history.seasons.length,experimentalGoals:{regular:regularEvents.length,playoffs:playoffEvents.length,leaders:aggregateExperimentalGoals(seasonEvents)},official:false,playerStatisticsCertified:false,assistsShotsGoalieStatisticsCertified:false,persistencePerformed:false,activationEnabled:false};
}
module.exports={previewRosterCareer};
