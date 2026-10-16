/* Experimental performance dashboard browser bundle. */
(function(global){'use strict';const module={exports:{}};const require=(path)=>{if(path==='./hlm-phase11-reliability-profiles')return global.HLMPhase11ReliabilityProfiles;throw Error('Unsupported module')};
'use strict';
/* Experimental read-only player performance trend dashboard. */
const {summarizeReliabilityProfiles}=require('./hlm-phase11-reliability-profiles');
const round=n=>Number(n.toFixed(6));
const sum=(xs,k)=>xs.reduce((n,x)=>n+x[k],0);
function dashboardRow(record){
 const p=record.reliabilityProfile,trend=record.gameTrends||[];
 const recent3=trend.slice(-3),previous3=trend.slice(-6,-3);
 const rate=rows=>rows.length?round(sum(rows,'goals')-sum(rows,'expectedGoals')):null;
 const recentGap=rate(recent3),previousGap=previous3.length===3?rate(previous3):null;
 const change=previousGap===null?null:round(recentGap-previousGap);
 const signal=p.eligibility==='insufficient-sample'||previousGap===null?'insufficient-evidence':
  change>0.5?'improving-observed':change< -0.5?'declining-observed':'no-material-observed-change';
 return {games:p.games,shots:p.shots,goals:p.goals,expectedGoals:p.expectedGoals,
  shotGames:p.shotGames,eligibility:p.eligibility,reliabilityTier:p.reliabilityTier,
  stabilityScore:p.stabilityScore,sampleSizeTier:p.sampleSizeTier,
  observedShootingPercentage:p.observedShootingPercentage,
  expectedShootingPercentage:p.expectedShootingPercentage,
  shootingPercentageStdDev:p.shootingPercentageStdDev,
  expectedGoalsPerGameStdDev:p.expectedGoalsPerGameStdDev,
  recent3Stability:p.recent3Stability,recent5Stability:p.recent5Stability,
  recent3GoalsAboveExpected:recentGap,previous3GoalsAboveExpected:previousGap,
  observedGapChange:change,trendSignal:signal,
  descriptiveOnly:true,notPredictive:true,notScoutingGrade:true};
}
function summarizePerformanceDashboard(homeLineup,awayLineup,options={}){
 const base=summarizeReliabilityProfiles(homeLineup,awayLineup,options);
 const players=base.players.map(p=>({...p,dashboard:dashboardRow(p)}));
 const teams={home:{...base.teams.home,dashboard:dashboardRow(base.teams.home)},
  away:{...base.teams.away,dashboard:dashboardRow(base.teams.away)}};
 const comparisons=base.comparisons.map(c=>{
  const p=players.find(x=>x.team===c.team&&x.playerId===c.playerId);
  if(!p)throw Error('Dashboard player identity mismatch');
  return {rank:c.rank,team:c.team,playerId:c.playerId,...p.dashboard,comparisonEligible:c.comparisonEligible};
 });
 const signalCounts={};
 for(const p of players)signalCounts[p.dashboard.trendSignal]=(signalCounts[p.dashboard.trendSignal]||0)+1;
 for(const side of ['home','away']){
  const members=players.filter(p=>p.team===side),t=teams[side].dashboard,rows=members.map(p=>p.dashboard);
  if(sum(rows,'shots')!==t.shots||sum(rows,'goals')!==t.goals||
   Math.abs(sum(rows,'expectedGoals')-t.expectedGoals)>members.length*0.000001+0.000001)
   throw Error('Dashboard team conservation mismatch');
  for(const p of members)if(p.dashboard.shots!==p.shots||p.dashboard.goals!==p.goals||
   Math.abs(p.dashboard.expectedGoals-p.expectedGoals)>0.000003)
   throw Error('Dashboard player conservation mismatch');
  for(const key of ['recent3GoalsAboveExpected','previous3GoalsAboveExpected']){
   if(t[key]!==null&&rows.every(x=>x[key]!==null)&&Math.abs(sum(rows,key)-t[key])>members.length*0.000001+0.000001)
    throw Error('Dashboard rolling conservation mismatch');
  }
 }
 if(new Set(comparisons.map(p=>p.team+':'+p.playerId)).size!==players.length)throw Error('Dashboard duplicate player identity');
 return {experimental:true,official:false,productionActivationEnabled:false,automaticallyApplied:false,requiresGMApproval:true,
  seed:base.seed,games:base.games,teams,players,comparisons,signalCounts,
  summaryModel:'experimental-performance-trend-dashboard-v1',
  interpretation:'descriptive-recent-three-vs-prior-three-goals-above-expected-not-forecast-or-player-grade'};
}
module.exports={summarizePerformanceDashboard,dashboardRow};

global.HLMPhase11PerformanceDashboard=module.exports;
})(typeof window!=='undefined'?window:globalThis);
