'use strict';
/* Read-only per-period goalie statistics derived from experimental shot outcomes. */
const {simulateShotOutcomes}=require('./hlm-phase11-shot-outcomes');
function summarizeGoaliePeriod(lineup,{goalie=null,periodSeconds=1200,shiftSeconds=45,seed=11}={}){
 const report=simulateShotOutcomes(lineup,{goalie,periodSeconds,shiftSeconds,seed});
 const byShooter=new Map();
 for(const event of report.events){
  const id=String(event.shooterId);
  const entry=byShooter.get(id)||{shooterId:id,shots:0,goals:0,saves:0,expectedGoals:0};
  entry.shots++;
  if(event.outcome==='goal')entry.goals++;else entry.saves++;
  entry.expectedGoals+=event.goalProbability;
  byShooter.set(id,entry);
 }
 const shooters=[...byShooter.values()].map(s=>({...s,expectedGoals:Number(s.expectedGoals.toFixed(6))})).sort((a,b)=>a.shooterId.localeCompare(b.shooterId));
 const shotsAgainst=report.shotsOnGoal;
 return {experimental:true,official:false,productionActivationEnabled:false,automaticallyApplied:false,requiresGMApproval:true,
  seed,periodSeconds,goalieId:goalie?.id==null?null:String(goalie.id),goalieRating:report.goalieRating,
  shotsAgainst,saves:report.saves,goalsAgainst:report.goals,
  savePercentage:shotsAgainst?Number((report.saves/shotsAgainst).toFixed(6)):null,
  expectedGoalsAgainst:report.expectedGoalsAgainst,
  shotsFor:shotsAgainst,goalsFor:report.goals,shooters,
  periodEvents:report.events.map(({second,shooterId,outcome,goalProbability,saveProbability})=>({second,shooterId,outcome,goalProbability,saveProbability})),
  summaryModel:'experimental-goalie-period-v1'};
}
module.exports={summarizeGoaliePeriod};
