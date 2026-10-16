/* Experimental consistency ranking browser bundle. */
(function(global){'use strict';const module={exports:{}};const require=(path)=>{if(path==='./hlm-phase11-performance-volatility')return global.HLMPhase11PerformanceVolatility;throw Error('Unsupported module')};
'use strict';
/* Experimental descriptive sample-aware stability ranking; not a scouting grade. */
const {summarizePerformanceVolatility}=require('./hlm-phase11-performance-volatility');
const round=n=>Number(n.toFixed(6));
const sum=(xs,k)=>xs.reduce((n,x)=>n+x[k],0);
function score(record){
 const v=record.volatility,c=record.finishingConfidence;
 const games=v.games,shots=v.shots,shotGames=v.shootingGames;
 // Confidence-weighting prevents tiny samples from receiving top scores.
 const sampleWeight=round(Math.min(1,shots/30)*Math.min(1,shotGames/5));
 const shootingStability=v.shootingPercentageStdDev===null?null:round(1/(1+4*v.shootingPercentageStdDev));
 const xgStability=v.expectedGoalsPerGameStdDev===null?null:round(1/(1+v.expectedGoalsPerGameStdDev));
 const base=shootingStability===null?xgStability:round((shootingStability+xgStability)/2);
 const stabilityScore=shotGames===0?null:round(100*sampleWeight*base);
 const eligibility=shotGames<3||shots<10?'insufficient-sample':shotGames<5||shots<30?'provisional':'comparable';
 return {games,shots,goals:v.goals,expectedGoals:v.expectedGoals,shotGames,sampleWeight,
  shootingStability,xgStability,stabilityScore,eligibility,
  sampleSizeTier:c.sampleSizeTier,descriptiveOnly:true,notPredictive:true};
}
function rank(players){
 const sorted=players.map(p=>({playerId:String(p.playerId),team:p.team,...p.consistencyScore})).sort((a,b)=>{
  const aEligible=a.eligibility==='comparable',bEligible=b.eligibility==='comparable';
  if(aEligible!==bEligible)return aEligible?-1:1;
  if(a.stabilityScore===null||b.stabilityScore===null){if(a.stabilityScore===null&&b.stabilityScore!==null)return 1;if(b.stabilityScore===null&&a.stabilityScore!==null)return -1}
  if(a.stabilityScore!==b.stabilityScore)return b.stabilityScore-a.stabilityScore;
  if(a.shots!==b.shots)return b.shots-a.shots;
  if(a.team!==b.team)return a.team.localeCompare(b.team);
  return a.playerId.localeCompare(b.playerId);
 });
 return sorted.map((p,i)=>({...p,rank:i+1,comparisonEligible:p.eligibility==='comparable'}));
}
function summarizeConsistencyRankings(homeLineup,awayLineup,options={}){
 const base=summarizePerformanceVolatility(homeLineup,awayLineup,options);
 const players=base.players.map(p=>({...p,consistencyScore:score(p)}));
 const teams={home:{...base.teams.home,consistencyScore:score(base.teams.home)},away:{...base.teams.away,consistencyScore:score(base.teams.away)}};
 const rankings=rank(players);
 for(const team of ['home','away']){
  const members=players.filter(p=>p.team===team),t=teams[team].consistencyScore;
  if(sum(members.map(p=>p.consistencyScore),'shots')!==t.shots||
   sum(members.map(p=>p.consistencyScore),'goals')!==t.goals||
   Math.abs(sum(members.map(p=>p.consistencyScore),'expectedGoals')-t.expectedGoals)>members.length*0.000001+0.000001)
   throw Error('Consistency ranking team conservation mismatch');
  for(const p of members)if(p.consistencyScore.shots!==p.shots||p.consistencyScore.goals!==p.goals||
   Math.abs(p.consistencyScore.expectedGoals-p.expectedGoals)>0.000003)
   throw Error('Consistency ranking player conservation mismatch');
 }
 if(new Set(rankings.map(p=>p.team+':'+p.playerId)).size!==players.length)throw Error('Consistency ranking duplicate player identity');
 return {experimental:true,official:false,productionActivationEnabled:false,automaticallyApplied:false,requiresGMApproval:true,
  seed:base.seed,games:base.games,teams,players,rankings,
  summaryModel:'experimental-consistency-rankings-v1',
  interpretation:'descriptive-sample-weighted-stability-rankings-not-player-quality-or-forecast'};
}
module.exports={summarizeConsistencyRankings,score,rank};

global.HLMPhase11ConsistencyRankings=module.exports;
})(typeof window!=='undefined'?window:globalThis);
