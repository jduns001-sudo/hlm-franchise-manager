'use strict';
/** Research-only manpower window audit; no official hockey simulation or persistence. */
const {createExperimentalSpecialTeams}=require('./hlm-experimental-special-teams');
function createExperimentalManpowerAudit(state,homeId,awayId,seed,playoff=false){
 const base=createExperimentalSpecialTeams(state,homeId,awayId,seed,playoff);
 if(!base.researchReady)return {kind:'experimental-manpower-audit',researchReady:false,blockers:base.blockers,events:null,teams:null,official:false,persistencePerformed:false};
 const events=base.events.map(e=>{
  const penalty=base.penalties.find(p=>p.period===e.period&&e.second>=p.second&&e.second<p.second+p.durationSeconds);
  const homeSkaters=penalty?(penalty.penalizedSide==='home'?4:5):5;
  const awaySkaters=penalty?(penalty.penalizedSide==='away'?4:5):5;
  const strength=homeSkaters===awaySkaters?'even':(e.side==='home'?homeSkaters>awaySkaters:awaySkaters>homeSkaters)?'power-play':'short-handed';
  return {...e,homeSkaters,awaySkaters,strength,manpowerPenaltyActive:Boolean(penalty)};
 });
 const teams={};
 for(const side of ['home','away']){
  const own=events.filter(e=>e.side===side),against=events.filter(e=>e.side!==side);
  const pp=own.filter(e=>e.strength==='power-play'),pk=against.filter(e=>e.strength==='power-play');
  const previous=base.teams[side];
  teams[side]={...previous,shots:own.length,goals:own.filter(e=>e.goal).length,powerPlayShots:pp.length,powerPlayGoals:pp.filter(e=>e.goal).length,penaltyKillShotsAgainst:pk.length,penaltyKillGoalsAgainst:pk.filter(e=>e.goal).length,evenStrengthShots:own.filter(e=>e.strength==='even').length,shortHandedShots:own.filter(e=>e.strength==='short-handed').length};
 }
 const valid=events.length===base.events.length&&events.every((e,i)=>e.goal===base.events[i].goal&&e.shooterId===base.events[i].shooterId&&e.homeSkaters>=4&&e.awaySkaters>=4&&e.homeSkaters<=5&&e.awaySkaters<=5&&e.strength===base.events[i].strength)&&['home','away'].every(side=>teams[side].goals===base.teams[side].goals&&teams[side].shots===base.teams[side].shots&&teams[side].evenStrengthShots+teams[side].shortHandedShots+teams[side].powerPlayShots===teams[side].shots);
 if(!valid)throw new Error('EXPERIMENTAL_MANPOWER_AUDIT_FAILED');
 return {kind:'experimental-manpower-audit',researchReady:true,events,penalties:base.penalties.map(p=>({...p})),teams,audit:{consistent:true,eventsChecked:events.length},manpowerMode:'synthetic-fixed-windows',game:base.game,official:false,persistencePerformed:false};
}
module.exports={createExperimentalManpowerAudit};
