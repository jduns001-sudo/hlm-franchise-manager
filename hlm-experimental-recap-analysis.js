'use strict';
/** Read-only analytics over hypothetical recaps, never authoritative hockey statistics. */
const {createExperimentalGameRecap}=require('./hlm-experimental-game-recaps');
function createExperimentalRecapAnalysis(state,homeId,awayId,seed,playoff=false){
 const recap=createExperimentalGameRecap(state,homeId,awayId,seed,playoff);
 if(!recap.researchReady)return {kind:'experimental-recap-analysis',researchReady:false,blockers:recap.blockers,periods:null,teams:null,official:false,persistencePerformed:false};
 const periods=recap.periods.map(p=>({
  ...p,homeShotShare:p.homeShots+p.awayShots?p.homeShots/(p.homeShots+p.awayShots):null,
  awayShotShare:p.homeShots+p.awayShots?p.awayShots/(p.homeShots+p.awayShots):null,
  homeGoalDifferential:p.homeGoals-p.awayGoals,
  awayGoalDifferential:p.awayGoals-p.homeGoals
 }));
 const teams={};
 for(const side of ['home','away']){
  const opponent=side==='home'?'away':'home';
  const t=recap.teams[side],opp=recap.teams[opponent];
  const totalShots=t.shots+opp.shots;
  teams[side]={teamId:t.teamId,goals:t.goals,shots:t.shots,expectedGoals:t.expectedGoals,goalsAboveExpected:Number((t.goals-t.expectedGoals).toFixed(4)),goalDifferential:t.goals-opp.goals,shotDifferential:t.shots-opp.shots,shotShare:totalShots?t.shots/totalShots:null,shootingPercentage:t.shots?t.goals/t.shots:null,savePercentage:t.goalie.shotsAgainst?t.goalie.saves/t.goalie.shotsAgainst:null,pdo:t.shots&&t.goalie.shotsAgainst?t.goals/t.shots+t.goalie.saves/t.goalie.shotsAgainst:null,powerPlayGoals:t.powerPlayGoals};
 }
 const valid=recap.audit.consistent&&periods.every(p=>p.homeGoalDifferential===-p.awayGoalDifferential&&(p.homeShotShare===null||Math.abs(p.homeShotShare+p.awayShotShare-1)<1e-12))&&['home','away'].every(side=>teams[side].goals===recap.teams[side].goals&&teams[side].shots===recap.teams[side].shots&&teams[side].shotShare!==null&&teams[side].shotShare>=0&&teams[side].shotShare<=1)&&teams.home.goalDifferential===-teams.away.goalDifferential;
 if(!valid)throw new Error('EXPERIMENTAL_RECAP_ANALYSIS_AUDIT_FAILED');
 return {kind:'experimental-recap-analysis',researchReady:true,periods,teams,audit:{consistent:true,periodsChecked:periods.length},game:recap.game,official:false,persistencePerformed:false};
}
module.exports={createExperimentalRecapAnalysis};
