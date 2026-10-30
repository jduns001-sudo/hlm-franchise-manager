'use strict';
const {eligibleExperimentalSkaters}=require('./hlm-phase11-unified-box-scores');
/**
 * Deterministic experimental goal attribution for simulated games.
 * Derived synthetic events, never historical NHL player statistics.
 */
function buildExperimentalGoalEvents(state,game,seed=1){
 if(!game||game.status!=='final'||!Number.isSafeInteger(game.homeGoals)||!Number.isSafeInteger(game.awayGoals)||
    game.homeGoals<0||game.awayGoals<0||!Number.isSafeInteger(seed)||seed<0)throw new TypeError('Valid final game and seed required');
 const events=[];
 for(const [teamId,goals] of [[game.homeTeamId,game.homeGoals],[game.awayTeamId,game.awayGoals]]){
  const skaters=eligibleExperimentalSkaters(state,teamId);
  if(!skaters.length&&goals>0)throw new Error('No eligible scoring players for team '+teamId);
  const sorted=skaters.slice().sort((a,b)=>String(a.id).localeCompare(String(b.id)));
  for(let i=0;i<goals;i++){
   // Preserve legacy numeric-ID attribution; hash nonnumeric IDs deterministically.
   const numericTeamId=Number(teamId||0);
   let teamOffset=numericTeamId;
   if(!Number.isFinite(numericTeamId)){
    teamOffset=0;
    for(const char of String(teamId))teamOffset=(Math.imul(teamOffset,31)+char.charCodeAt(0))>>>0;
   }
   const index=(seed+i*7+teamOffset)%sorted.length;
   events.push({gameId:game.id,teamId,playerId:sorted[index].id,type:'goal',sequence:i+1,experimental:true});
  }
 }
 return events;
}
function aggregateExperimentalGoals(events){
 const counts=new Map();
 for(const event of events){
  if(event.type!=='goal'||event.experimental!==true)throw new TypeError('Only experimental goal events supported');
  const id=String(event.playerId);counts.set(id,(counts.get(id)||0)+1);
 }
 return [...counts].map(([playerId,goals])=>({playerId,goals})).sort((a,b)=>b.goals-a.goals||a.playerId.localeCompare(b.playerId));
}
module.exports={buildExperimentalGoalEvents,aggregateExperimentalGoals};
