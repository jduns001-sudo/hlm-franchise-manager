/* Experimental player shot statistics browser bundle. */
(function(global){'use strict';const module={exports:{}};const require=(path)=>{if(path==='./hlm-phase11-goalie-period-stats')return global.HLMPhase11GoaliePeriodStats;if(path==='./hlm-phase11-player-goals')return global.HLMPhase11PlayerGoals;throw Error('Unsupported module')};
'use strict';
/* Read-only player shot attribution derived from the same seeded goal/save events. */
const {summarizeGoaliePeriod}=require('./hlm-phase11-goalie-period-stats');
const {summarizePlayerGoals}=require('./hlm-phase11-player-goals');
const round=n=>Number(n.toFixed(6));
function summarizePlayerShots(homeLineup,awayLineup,options={}){
 const {homeGoalie=null,awayGoalie=null,periodSeconds=1200,shiftSeconds=45,seed=11}=options;
 // Existing player-goal report validates identities before simulation.
 const goals=summarizePlayerGoals(homeLineup,awayLineup,options);
 const players=new Map();
 const periodSummaries=goals.periodSummaries.map(p=>({...p,homeShots:0,awayShots:0}));
 const rosters={home:new Set(homeLineup.map(p=>String(p.id))),away:new Set(awayLineup.map(p=>String(p.id)))};
 for(let period=0;period<goals.periods;period++){
  for(const side of [{team:'home',lineup:homeLineup,goalie:awayGoalie,offset:0},{team:'away',lineup:awayLineup,goalie:homeGoalie,offset:1000003}]){
   const report=summarizeGoaliePeriod(side.lineup,{goalie:side.goalie,periodSeconds,shiftSeconds,seed:seed+side.offset+period});
   for(const event of report.periodEvents){
    const playerId=String(event.shooterId);
    if(!rosters[side.team].has(playerId))throw new Error('Shot attributed to unknown player: '+playerId);
    const key=side.team+':'+playerId;
    const row=players.get(key)||{team:side.team,playerId,shots:0,goals:0,periodShots:Array(goals.periods).fill(0),periodGoals:Array(goals.periods).fill(0)};
    row.shots++;row.periodShots[period]++;
    if(event.outcome==='goal'){row.goals++;row.periodGoals[period]++}
    players.set(key,row);
    periodSummaries[period][side.team==='home'?'homeShots':'awayShots']++;
   }
  }
 }
 const totals=[...players.values()].map(p=>({...p,shootingPercentage:p.shots?round(p.goals/p.shots):null})).sort((a,b)=>a.team.localeCompare(b.team)||a.playerId.localeCompare(b.playerId));
 for(const team of ['home','away']){
  const shotTotal=totals.filter(p=>p.team===team).reduce((n,p)=>n+p.shots,0);
  const goalTotal=totals.filter(p=>p.team===team).reduce((n,p)=>n+p.goals,0);
  if(shotTotal!==periodSummaries.reduce((n,p)=>n+p[team==='home'?'homeShots':'awayShots'],0)||goalTotal!==goals[team+'Score'])throw Error('Player shot conservation mismatch');
  for(const p of periodSummaries){
   if(totals.filter(x=>x.team===team).reduce((n,x)=>n+x.periodGoals[p.period-1],0)!==p[team+'Goals'])throw Error('Period goal conservation mismatch');
  }
 }
 return {experimental:true,official:false,productionActivationEnabled:false,automaticallyApplied:false,requiresGMApproval:true,
 seed,periods:goals.periods,homeScore:goals.homeScore,awayScore:goals.awayScore,
 homeShots:periodSummaries.reduce((n,p)=>n+p.homeShots,0),awayShots:periodSummaries.reduce((n,p)=>n+p.awayShots,0),
 players:totals,periodSummaries,summaryModel:'experimental-player-shots-v1'};
}
module.exports={summarizePlayerShots};

global.HLMPhase11PlayerShots=module.exports;
})(typeof window!=='undefined'?window:globalThis);
