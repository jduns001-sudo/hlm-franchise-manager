'use strict';
/* Read-only deterministic player goal attribution from experimental goal timelines. */
const {summarizeGoalTimeline}=require('./hlm-phase11-goal-timeline');
function summarizePlayerGoals(homeLineup,awayLineup,options={}){
 const timeline=summarizeGoalTimeline(homeLineup,awayLineup,options);
 const rosterIds=side=>{
  if(!Array.isArray(side))throw new TypeError('Lineup must be an array');
  const ids=new Set();
  for(const player of side){
   if(player?.id==null||String(player.id).trim()==='')throw new TypeError('Player ID is required');
   const id=String(player.id);
   if(ids.has(id))throw new Error('Duplicate player ID within lineup: '+id);
   ids.add(id);
  }
  return ids;
 };
 const homeIds=rosterIds(homeLineup),awayIds=rosterIds(awayLineup);
 const totals=new Map();
 const goals=timeline.timeline.map(event=>{
  const ids=event.scoringTeam==='home'?homeIds:awayIds;
  const scorerId=String(event.scorerId);
  if(!ids.has(scorerId))throw new Error('Scorer not found in scoring team lineup: '+scorerId);
  const key=event.scoringTeam+':'+scorerId;
  const row=totals.get(key)||{team:event.scoringTeam,playerId:scorerId,goals:0,periodGoals:Array(timeline.periods).fill(0)};
  row.goals++;row.periodGoals[event.period-1]++;
  totals.set(key,row);
  return {...event,scorerId};
 });
 const players=[...totals.values()].sort((a,b)=>a.team.localeCompare(b.team)||a.playerId.localeCompare(b.playerId));
 const homeGoals=players.filter(p=>p.team==='home').reduce((n,p)=>n+p.goals,0);
 const awayGoals=players.filter(p=>p.team==='away').reduce((n,p)=>n+p.goals,0);
 if(homeGoals!==timeline.homeScore||awayGoals!==timeline.awayScore)throw new Error('Player goal conservation mismatch');
 for(const p of timeline.periodSummaries){
  if(players.filter(x=>x.team==='home').reduce((n,x)=>n+x.periodGoals[p.period-1],0)!==p.homeGoals||
     players.filter(x=>x.team==='away').reduce((n,x)=>n+x.periodGoals[p.period-1],0)!==p.awayGoals)throw new Error('Period goal conservation mismatch');
 }
 return {experimental:true,official:false,productionActivationEnabled:false,automaticallyApplied:false,requiresGMApproval:true,
  seed:timeline.seed,periods:timeline.periods,homeScore:timeline.homeScore,awayScore:timeline.awayScore,
  goals,players,periodSummaries:timeline.periodSummaries,summaryModel:'experimental-player-goals-v1'};
}
module.exports={summarizePlayerGoals};
