'use strict';
/* Read-only experimental two-sided shot and scoring report. */
const {summarizeGoalieGame}=require('./hlm-phase11-goalie-game-stats');
const round=n=>Number(n.toFixed(6));
function summarizeTeamGame(homeLineup,awayLineup,{homeGoalie=null,awayGoalie=null,periods=3,periodSeconds=1200,shiftSeconds=45,seed=11}={}){
 if(!Number.isSafeInteger(seed)||seed<0||!Number.isSafeInteger(seed+1000003))throw new TypeError('Invalid safe seed');
 const homeAttack=summarizeGoalieGame(homeLineup,{goalie:awayGoalie,periods,periodSeconds,shiftSeconds,seed});
 const awayAttack=summarizeGoalieGame(awayLineup,{goalie:homeGoalie,periods,periodSeconds,shiftSeconds,seed:seed+1000003});
 const home={shotsFor:homeAttack.totals.shotsAgainst,shotsAgainst:awayAttack.totals.shotsAgainst,
  goalsFor:homeAttack.totals.goalsAgainst,goalsAgainst:awayAttack.totals.goalsAgainst,
  saves:awayAttack.totals.saves,expectedGoalsFor:homeAttack.totals.expectedGoalsAgainst,expectedGoalsAgainst:awayAttack.totals.expectedGoalsAgainst};
 const away={shotsFor:awayAttack.totals.shotsAgainst,shotsAgainst:homeAttack.totals.shotsAgainst,
  goalsFor:awayAttack.totals.goalsAgainst,goalsAgainst:homeAttack.totals.goalsAgainst,
  saves:homeAttack.totals.saves,expectedGoalsFor:awayAttack.totals.expectedGoalsAgainst,expectedGoalsAgainst:homeAttack.totals.expectedGoalsAgainst};
 for(const team of [home,away]){
  team.shootingPercentage=team.shotsFor?round(team.goalsFor/team.shotsFor):null;
  team.savePercentage=team.shotsAgainst?round(team.saves/team.shotsAgainst):null;
 }
 const periodReports=homeAttack.periodReports.map((h,index)=>{
  const a=awayAttack.periodReports[index];
  return {period:index+1,home:{shotsFor:h.shotsAgainst,shotsAgainst:a.shotsAgainst,goalsFor:h.goalsAgainst,goalsAgainst:a.goalsAgainst,expectedGoalsFor:h.expectedGoalsAgainst,expectedGoalsAgainst:a.expectedGoalsAgainst},
   away:{shotsFor:a.shotsAgainst,shotsAgainst:h.shotsAgainst,goalsFor:a.goalsAgainst,goalsAgainst:h.goalsAgainst,expectedGoalsFor:a.expectedGoalsAgainst,expectedGoalsAgainst:h.expectedGoalsAgainst}};
 });
 return {experimental:true,official:false,productionActivationEnabled:false,automaticallyApplied:false,requiresGMApproval:true,
  seed,periods,periodSeconds,home,away,periodReports,homeShooters:homeAttack.shooters,awayShooters:awayAttack.shooters,
  summaryModel:'experimental-team-game-shots-v1'};
}
module.exports={summarizeTeamGame};
