'use strict';
/** Synthetic period momentum: descriptive analytics, not a causal game engine. */
const {createExperimentalRecapAnalysis}=require('./hlm-experimental-recap-analysis');
function createExperimentalMomentum(state,homeId,awayId,seed,playoff=false){
 const base=createExperimentalRecapAnalysis(state,homeId,awayId,seed,playoff);
 if(!base.researchReady)return {kind:'experimental-momentum',researchReady:false,blockers:base.blockers,periods:null,teams:null,official:false,persistencePerformed:false};
 let cumulativeHomeGoals=0,cumulativeAwayGoals=0,cumulativeHomeShots=0,cumulativeAwayShots=0;
 const periods=base.periods.map(p=>{
  cumulativeHomeGoals+=p.homeGoals;cumulativeAwayGoals+=p.awayGoals;
  cumulativeHomeShots+=p.homeShots;cumulativeAwayShots+=p.awayShots;
  const shotEdge=p.homeShots-p.awayShots,goalEdge=p.homeGoals-p.awayGoals;
  const momentumScore=Math.max(-100,Math.min(100,shotEdge*5+goalEdge*20));
  return {...p,cumulativeHomeGoals,cumulativeAwayGoals,cumulativeHomeShots,cumulativeAwayShots,momentumScore,momentumLeader:momentumScore>0?'home':momentumScore<0?'away':'even',scoreLeader:cumulativeHomeGoals>cumulativeAwayGoals?'home':cumulativeAwayGoals>cumulativeHomeGoals?'away':'tied'};
 });
 const last=periods.at(-1);
 const teams={home:{...base.teams.home,periodsLed:periods.filter(p=>p.momentumLeader==='home').length},away:{...base.teams.away,periodsLed:periods.filter(p=>p.momentumLeader==='away').length}};
 const valid=base.audit.consistent&&Boolean(last)&&last.cumulativeHomeGoals===teams.home.goals&&last.cumulativeAwayGoals===teams.away.goals&&last.cumulativeHomeShots===teams.home.shots&&last.cumulativeAwayShots===teams.away.shots&&periods.every(p=>p.momentumScore>=-100&&p.momentumScore<=100&&['home','away','even'].includes(p.momentumLeader));
 if(!valid)throw new Error('EXPERIMENTAL_MOMENTUM_AUDIT_FAILED');
 return {kind:'experimental-momentum',researchReady:true,periods,teams,audit:{consistent:true,periodsChecked:periods.length},momentumMode:'synthetic-descriptive',game:base.game,official:false,persistencePerformed:false};
}
module.exports={createExperimentalMomentum};
