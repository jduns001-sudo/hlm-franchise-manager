'use strict';
/* Read-only, experimental full-game aggregation of independent seeded periods. */
const {summarizeGoaliePeriod}=require('./hlm-phase11-goalie-period-stats');
const round=n=>Number(n.toFixed(6));
function summarizeGoalieGame(lineup,{goalie=null,periods=3,periodSeconds=1200,shiftSeconds=45,seed=11}={}){
 if(!Number.isSafeInteger(periods)||periods<1||periods>10)throw new RangeError('periods must be an integer from 1 to 10');
 if(!Number.isSafeInteger(seed)||seed<0)throw new TypeError('Seed must be a nonnegative safe integer');
 const periodReports=Array.from({length:periods},(_,index)=>{
  const periodSeed=seed+index;
  if(!Number.isSafeInteger(periodSeed))throw new RangeError('Period seed overflow');
  return {period:index+1,...summarizeGoaliePeriod(lineup,{goalie,periodSeconds,shiftSeconds,seed:periodSeed})};
 });
 const totals={shotsAgainst:0,saves:0,goalsAgainst:0,expectedGoalsAgainst:0};
 const byShooter=new Map();
 for(const period of periodReports){
  totals.shotsAgainst+=period.shotsAgainst;totals.saves+=period.saves;totals.goalsAgainst+=period.goalsAgainst;
  totals.expectedGoalsAgainst+=period.expectedGoalsAgainst;
  for(const shooter of period.shooters){
   const row=byShooter.get(shooter.shooterId)||{shooterId:shooter.shooterId,shots:0,goals:0,saves:0,expectedGoals:0};
   row.shots+=shooter.shots;row.goals+=shooter.goals;row.saves+=shooter.saves;row.expectedGoals+=shooter.expectedGoals;
   byShooter.set(shooter.shooterId,row);
  }
 }
 const shooters=[...byShooter.values()].map(row=>({...row,expectedGoals:round(row.expectedGoals)})).sort((a,b)=>a.shooterId.localeCompare(b.shooterId));
 totals.expectedGoalsAgainst=round(totals.expectedGoalsAgainst);
 totals.savePercentage=totals.shotsAgainst?round(totals.saves/totals.shotsAgainst):null;
 return {experimental:true,official:false,productionActivationEnabled:false,automaticallyApplied:false,requiresGMApproval:true,
  seed,periods,periodSeconds,goalieId:goalie?.id==null?null:String(goalie.id),periodReports,
  totals,shooters,summaryModel:'experimental-goalie-game-v1'};
}
module.exports={summarizeGoalieGame};
