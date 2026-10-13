'use strict';
/** Hypothetical minor-penalty expiration audit; never changes inherited game scores. */
const {createExperimentalManpowerAudit}=require('./hlm-experimental-manpower');
function createExperimentalPenaltyClockAudit(state,homeId,awayId,seed,playoff=false){
 const base=createExperimentalManpowerAudit(state,homeId,awayId,seed,playoff);
 if(!base.researchReady)return {kind:'experimental-penalty-clock-audit',researchReady:false,blockers:base.blockers,events:null,teams:null,official:false,persistencePerformed:false};
 const penalties=base.penalties.map((p,index)=>({...p,id:index+1,scheduledEndSecond:p.second+p.durationSeconds,effectiveEndSecond:p.second+p.durationSeconds,endedByGoal:false}));
 const events=base.events.map(e=>({...e}));
 for(const p of penalties){
  const goal=events.find(e=>e.period===p.period&&e.goal&&e.side!==p.penalizedSide&&e.second>=p.second&&e.second<p.effectiveEndSecond);
  if(goal){p.effectiveEndSecond=goal.second;p.endedByGoal=true;}
 }
 for(const e of events){
  const active=penalties.find(p=>p.period===e.period&&e.second>=p.second&&e.second<=p.effectiveEndSecond&&(e.second<p.effectiveEndSecond||e.goal&&p.endedByGoal&&e.second===p.effectiveEndSecond&&e.side!==p.penalizedSide));
  e.strength=active?(e.side===active.penalizedSide?'short-handed':'power-play'):'even';
  e.homeSkaters=active&&active.penalizedSide==='home'?4:5;
  e.awaySkaters=active&&active.penalizedSide==='away'?4:5;
  e.manpowerPenaltyActive=Boolean(active);
 }
 const teams={};
 for(const side of ['home','away']){
  const own=events.filter(e=>e.side===side),against=events.filter(e=>e.side!==side),pp=own.filter(e=>e.strength==='power-play'),pk=against.filter(e=>e.strength==='power-play');
  teams[side]={...base.teams[side],shots:own.length,goals:own.filter(e=>e.goal).length,powerPlayShots:pp.length,powerPlayGoals:pp.filter(e=>e.goal).length,penaltyKillShotsAgainst:pk.length,penaltyKillGoalsAgainst:pk.filter(e=>e.goal).length,evenStrengthShots:own.filter(e=>e.strength==='even').length,shortHandedShots:own.filter(e=>e.strength==='short-handed').length};
 }
 const valid=events.length===base.events.length&&events.every((e,i)=>e.goal===base.events[i].goal&&e.shooterId===base.events[i].shooterId&&e.homeSkaters>=4&&e.awaySkaters>=4)&&penalties.every(p=>p.effectiveEndSecond>=p.second&&p.effectiveEndSecond<=p.scheduledEndSecond)&&['home','away'].every(side=>teams[side].shots===base.teams[side].shots&&teams[side].goals===base.teams[side].goals&&teams[side].evenStrengthShots+teams[side].shortHandedShots+teams[side].powerPlayShots===teams[side].shots);
 if(!valid)throw new Error('EXPERIMENTAL_PENALTY_CLOCK_AUDIT_FAILED');
 return {kind:'experimental-penalty-clock-audit',researchReady:true,events,penalties,teams,audit:{consistent:true,eventsChecked:events.length},penaltyMode:'synthetic-goal-expiring-minors',game:base.game,official:false,persistencePerformed:false};
}
module.exports={createExperimentalPenaltyClockAudit};
