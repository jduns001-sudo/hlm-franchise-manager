'use strict';
/** Deterministic synthetic game trends, research-only and without save writes. */
const {createExperimentalMomentum}=require('./hlm-experimental-momentum');
function createExperimentalGameTrends(state,homeId,awayId,seed,playoff=false){
 const base=createExperimentalMomentum(state,homeId,awayId,seed,playoff);
 if(!base.researchReady)return {kind:'experimental-game-trends',researchReady:false,blockers:base.blockers,periods:null,teams:null,official:false,persistencePerformed:false};
 let previousHomeGoals=0,previousAwayGoals=0,previousHomeShots=0,previousAwayShots;
 const periods=base.periods.map(p=>{
  const homeGoalSwing=p.cumulativeHomeGoals-previousHomeGoals,awayGoalSwing=p.cumulativeAwayGoals-previousAwayGoals;
  const homeShotSwing=p.cumulativeHomeShots-previousHomeShots,awayShotSwing=p.cumulativeAwayShots-previousAwayShots;
  previousHomeGoals=p.cumulativeHomeGoals;previousAwayGoals=p.cumulativeAwayGoals;
  previousHomeShots=p.cumulativeHomeShots;previousAwayShots=p.cumulativeAwayShots;
  return {...p,homeGoalSwing,awayGoalSwing,homeShotSwing,awayShotSwing,goalMargin:p.cumulativeHomeGoals-p.cumulativeAwayGoals,shotMargin:p.cumulativeHomeShots-p.cumulativeAwayShots,periodIntensity:homeShotSwing+awayShotSwing,closeGame:Math.abs(p.cumulativeHomeGoals-p.cumulativeAwayGoals)<=1};
 });
 const teams={};
 for(const side of ['home','away']){
  const opponent=side==='home'?'away':'home';
  const t=base.teams[side],opp=base.teams[opponent];
  teams[side]={teamId:t.teamId,goals:t.goals,shots:t.shots,goalDifferential:t.goals-opp.goals,shotDifferential:t.shots-opp.shots,periodsLed:t.periodsLed,periodsOutshotOpponent:periods.filter(p=>side==='home'?p.homeShots>p.awayShots:p.awayShots>p.homeShots).length,periodsOutscoredOpponent:periods.filter(p=>side==='home'?p.homeGoals>p.awayGoals:p.awayGoals>p.homeGoals).length};
 }
 const last=periods.at(-1);
 const valid=base.audit.consistent&&Boolean(last)&&last.goalMargin===teams.home.goalDifferential&&last.shotMargin===teams.home.shotDifferential&&teams.home.goalDifferential===-teams.away.goalDifferential&&teams.home.shotDifferential===-teams.away.shotDifferential&&periods.every(p=>p.homeGoalSwing===p.homeGoals&&p.awayGoalSwing===p.awayGoals&&p.homeShotSwing===p.homeShots&&p.awayShotSwing===p.awayShots&&p.periodIntensity===p.homeShots+p.awayShots);
 if(!valid)throw new Error('EXPERIMENTAL_GAME_TRENDS_AUDIT_FAILED '+JSON.stringify({last,home:teams.home,away:teams.away,periodsValid:periods.map(p=>({period:p.period,homeGoalSwing:p.homeGoalSwing,homeGoals:p.homeGoals,awayGoalSwing:p.awayGoalSwing,awayGoals:p.awayGoals,homeShotSwing:p.homeShotSwing,homeShots:p.homeShots,awayShotSwing:p.awayShotSwing,awayShots:p.awayShots}))}));
 return {kind:'experimental-game-trends',researchReady:true,periods,teams,audit:{consistent:true,periodsChecked:periods.length},trendMode:'synthetic-descriptive',game:base.game,official:false,persistencePerformed:false};
}
module.exports={createExperimentalGameTrends};
