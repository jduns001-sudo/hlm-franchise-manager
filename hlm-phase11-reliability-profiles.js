'use strict';
/* Experimental descriptive reliability profile; never a scouting grade or forecast. */
const {summarizeConsistencyRankings}=require('./hlm-phase11-consistency-rankings');
const round=n=>Number(n.toFixed(6));
const sum=(xs,k)=>xs.reduce((n,x)=>n+x[k],0);
function profile(record){
 const c=record.consistencyScore,f=record.finishingConfidence,v=record.volatility;
 const tier=c.eligibility==='insufficient-sample'?'insufficient-data':
  c.eligibility==='provisional'?'emerging-evidence':
  c.stabilityScore>=75?'more-consistent-observed':
  c.stabilityScore>=45?'mixed-observed':'less-consistent-observed';
 const observedGap=f.finishingGap;
 const gapDescription=observedGap===null?'no-shots':observedGap>0.05?'above-expected-observed':
  observedGap< -0.05?'below-expected-observed':'near-expected-observed';
 const recent3=record.rolling3Volatility.at(-1)||null;
 const recent5=record.rolling5Volatility.at(-1)||null;
 return {games:c.games,shots:c.shots,goals:c.goals,expectedGoals:c.expectedGoals,
  shotGames:c.shotGames,sampleSizeTier:f.sampleSizeTier,eligibility:c.eligibility,
  stabilityScore:c.stabilityScore,reliabilityTier:tier,gapDescription,
  observedShootingPercentage:f.observedShootingPercentage,
  expectedShootingPercentage:f.expectedShootingPercentage,
  shootingPercentageStdDev:v.shootingPercentageStdDev,
  expectedGoalsPerGameStdDev:v.expectedGoalsPerGameStdDev,
  recent3Stability:recent3?recent3.stabilityIndicator:null,
  recent5Stability:recent5?recent5.stabilityIndicator:null,
  descriptiveOnly:true,notPredictive:true,notScoutingGrade:true};
}
function summarizeReliabilityProfiles(homeLineup,awayLineup,options={}){
 const base=summarizeConsistencyRankings(homeLineup,awayLineup,options);
 const players=base.players.map(p=>({...p,reliabilityProfile:profile(p)}));
 const teams={home:{...base.teams.home,reliabilityProfile:profile(base.teams.home)},
  away:{...base.teams.away,reliabilityProfile:profile(base.teams.away)}};
 const comparisons=base.rankings.map(r=>{
  const p=players.find(x=>x.team===r.team&&x.playerId===r.playerId);
  if(!p)throw Error('Reliability ranking identity mismatch');
  return {rank:r.rank,team:r.team,playerId:r.playerId,...p.reliabilityProfile,comparisonEligible:r.comparisonEligible};
 });
 for(const team of ['home','away']){
  const members=players.filter(p=>p.team===team),t=teams[team].reliabilityProfile;
  if(sum(members.map(p=>p.reliabilityProfile),'shots')!==t.shots||
   sum(members.map(p=>p.reliabilityProfile),'goals')!==t.goals||
   Math.abs(sum(members.map(p=>p.reliabilityProfile),'expectedGoals')-t.expectedGoals)>members.length*0.000001+0.000001)
   throw Error('Reliability profile team conservation mismatch');
  for(const p of members)if(p.reliabilityProfile.shots!==p.shots||p.reliabilityProfile.goals!==p.goals||
   Math.abs(p.reliabilityProfile.expectedGoals-p.expectedGoals)>0.000003)
   throw Error('Reliability profile player conservation mismatch');
 }
 if(new Set(comparisons.map(p=>p.team+':'+p.playerId)).size!==players.length)throw Error('Reliability duplicate player identity');
 return {experimental:true,official:false,productionActivationEnabled:false,automaticallyApplied:false,requiresGMApproval:true,
  seed:base.seed,games:base.games,teams,players,comparisons,
  summaryModel:'experimental-reliability-profiles-v1',
  interpretation:'descriptive-sample-aware-observed-stability-and-finishing-not-predictive-or-scouting-grade'};
}
module.exports={summarizeReliabilityProfiles,profile};
