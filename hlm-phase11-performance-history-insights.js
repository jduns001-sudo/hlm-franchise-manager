'use strict';
/* Ephemeral descriptive insights from independently seeded simulated periods. */
const {summarizePerformanceTrendHistory}=require('./hlm-phase11-performance-trend-history');
const round=n=>Number(n.toFixed(6));
const sum=(xs,k)=>xs.reduce((n,x)=>n+x[k],0);
const positive='improving-observed',negative='declining-observed',neutral='no-material-observed-change';
function insight(periods){
 if(!Array.isArray(periods)||periods.length<2)throw RangeError('At least two periods required');
 const eligible=periods.every(p=>p.eligibility==='comparable');
 const signals=periods.map(p=>p.trendSignal);
 const observed=signals.filter(s=>s===positive||s===negative);
 const last=signals.at(-1);
 const streak=last===positive||last===negative?signals.slice().reverse().findIndex(s=>s!==last):-1;
 const persistence=streak===-1?(last===positive||last===negative?signals.length:0):streak;
 const persistent=eligible&&persistence>=2;
 const stabilityDelta=periods.every(p=>p.stabilityScore!==null)?round(periods.at(-1).stabilityScore-periods[0].stabilityScore):null;
 const shots=sum(periods,'shots'),goals=sum(periods,'goals'),expectedGoals=round(sum(periods,'expectedGoals'));
 const first=periods[0],final=periods.at(-1);
 const shootingChange=first.observedShootingPercentage===null||final.observedShootingPercentage===null?null:
  round(final.observedShootingPercentage-first.observedShootingPercentage);
 return {periodCount:periods.length,shots,goals,expectedGoals,
  sampleEligible:eligible,observedSignalCount:observed.length,latestSignal:last,
  latestDirectionalStreak:persistence,persistentDirectionalSignal:persistent?last:null,
  stabilityDelta,shootingPercentageChange:shootingChange,
  firstReliabilityTier:first.reliabilityTier,latestReliabilityTier:final.reliabilityTier,
  evidenceTier:eligible?'comparable-periods':'insufficient-period-evidence',
  descriptiveOnly:true,notPredictive:true,notScoutingGrade:true};
}
function summarizePerformanceHistoryInsights(homeLineup,awayLineup,options={}){
 const base=summarizePerformanceTrendHistory(homeLineup,awayLineup,options);
 const players=base.players.map(p=>({...p,insight:insight(p.periods)}));
 const teams={home:{...base.teams.home,insight:insight(base.teams.home.periods)},
  away:{...base.teams.away,insight:insight(base.teams.away.periods)}};
 const comparisons=players.map(p=>({team:p.team,playerId:p.playerId,...p.insight})).sort((a,b)=>{
  if(a.sampleEligible!==b.sampleEligible)return a.sampleEligible?-1:1;
  if(a.latestDirectionalStreak!==b.latestDirectionalStreak)return b.latestDirectionalStreak-a.latestDirectionalStreak;
  if(a.shots!==b.shots)return b.shots-a.shots;
  if(a.team!==b.team)return a.team.localeCompare(b.team);
  return a.playerId.localeCompare(b.playerId);
 }).map((p,i)=>({...p,rank:i+1}));
 const counts={};
 for(const p of players){const k=p.insight.persistentDirectionalSignal||'not-persistent';counts[k]=(counts[k]||0)+1}
 for(const side of ['home','away']){
  const rows=players.filter(p=>p.team===side).map(p=>p.insight),t=teams[side].insight;
  if(sum(rows,'shots')!==t.shots||sum(rows,'goals')!==t.goals||
   Math.abs(sum(rows,'expectedGoals')-t.expectedGoals)>rows.length*0.000002+0.000001)
   throw Error('History insights conservation mismatch');
 }
 if(new Set(comparisons.map(p=>p.team+':'+p.playerId)).size!==players.length)throw Error('History insights duplicate player identity');
 return {experimental:true,official:false,productionActivationEnabled:false,automaticallyApplied:false,requiresGMApproval:true,
  seed:base.seed,periodCount:base.periodCount,gamesPerPeriod:base.gamesPerPeriod,totalGames:base.totalGames,
  snapshots:base.snapshots,players,teams,comparisons,persistenceCounts:counts,
  summaryModel:'experimental-performance-history-insights-v1',
  interpretation:'independent-simulated-period-comparisons-descriptive-not-actual-franchise-history-or-prediction'};
}
module.exports={summarizePerformanceHistoryInsights,insight};
