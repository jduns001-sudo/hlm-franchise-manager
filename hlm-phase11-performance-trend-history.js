'use strict';
/* Deterministic ephemeral multi-period history, never persisted to a production save. */
const {summarizePerformanceDashboard}=require('./hlm-phase11-performance-dashboard');
const round=n=>Number(n.toFixed(6));
const sum=(xs,k)=>xs.reduce((n,x)=>n+x[k],0);
function summarizePerformanceTrendHistory(homeLineup,awayLineup,options={}){
 const periods=options.periods===undefined?3:options.periods;
 const gamesPerPeriod=options.gamesPerPeriod===undefined?6:options.gamesPerPeriod;
 if(!Number.isInteger(periods)||periods<2||periods>12)throw RangeError('periods must be an integer from 2 to 12');
 if(!Number.isInteger(gamesPerPeriod)||gamesPerPeriod<1||gamesPerPeriod>30)throw RangeError('gamesPerPeriod must be an integer from 1 to 30');
 const seed=options.seed===undefined?11:options.seed;
 if(!Number.isSafeInteger(seed)||seed<0||seed>2147483647-periods*9973)throw RangeError('seed must be a nonnegative safe simulation seed');
 const snapshots=Array.from({length:periods},(_,i)=>{
  const report=summarizePerformanceDashboard(homeLineup,awayLineup,{...options,seed:seed+i*9973,games:gamesPerPeriod});
  return {period:i+1,seed:seed+i*9973,games:report.games,teams:report.teams,
   players:report.players.map(p=>({team:p.team,playerId:p.playerId,dashboard:p.dashboard})),
   comparisons:report.comparisons,signalCounts:report.signalCounts};
 });
 const playerKeys=snapshots[0].players.map(p=>p.team+':'+p.playerId);
 if(new Set(playerKeys).size!==playerKeys.length)throw Error('History duplicate player identities');
 const players=playerKeys.map(key=>{
  const entries=snapshots.map(s=>{
   const p=s.players.find(x=>x.team+':'+x.playerId===key);
   if(!p)throw Error('History player missing from period');
   return {period:s.period,...p.dashboard};
  });
  const first=snapshots[0].players.find(p=>p.team+':'+p.playerId===key);
  return {team:first.team,playerId:first.playerId,periods:entries,
   totals:{games:sum(entries,'games'),shots:sum(entries,'shots'),goals:sum(entries,'goals'),
    expectedGoals:round(sum(entries,'expectedGoals'))},
   stabilityChange:entries.every(e=>e.stabilityScore!==null)?round(entries.at(-1).stabilityScore-entries[0].stabilityScore):null,
   comparisonEligible:entries.every(e=>e.eligibility==='comparable'),
   descriptiveOnly:true,notPredictive:true};
 });
 const teams={};
 for(const side of ['home','away']){
  const entries=snapshots.map(s=>({period:s.period,...s.teams[side].dashboard}));
  teams[side]={periods:entries,totals:{games:sum(entries,'games'),shots:sum(entries,'shots'),
   goals:sum(entries,'goals'),expectedGoals:round(sum(entries,'expectedGoals'))}};
  const members=players.filter(p=>p.team===side);
  if(sum(members.map(p=>p.totals),'shots')!==teams[side].totals.shots||
   sum(members.map(p=>p.totals),'goals')!==teams[side].totals.goals||
   Math.abs(sum(members.map(p=>p.totals),'expectedGoals')-teams[side].totals.expectedGoals)>members.length*0.000002+0.000001)
   throw Error('History team conservation mismatch');
  for(const snapshot of snapshots){
   const team=snapshot.teams[side].dashboard,rows=snapshot.players.filter(p=>p.team===side).map(p=>p.dashboard);
   if(sum(rows,'shots')!==team.shots||sum(rows,'goals')!==team.goals||
    Math.abs(sum(rows,'expectedGoals')-team.expectedGoals)>rows.length*0.000001+0.000001)
    throw Error('History period conservation mismatch');
  }
 }
 return {experimental:true,official:false,productionActivationEnabled:false,automaticallyApplied:false,requiresGMApproval:true,
  seed,periodCount:periods,gamesPerPeriod,totalGames:periods*gamesPerPeriod,
  snapshots,players,teams,summaryModel:'experimental-performance-trend-history-v1',
  interpretation:'independent-seeded-period-snapshots-descriptive-not-continuous-save-history-or-prediction'};
}
module.exports={summarizePerformanceTrendHistory};
