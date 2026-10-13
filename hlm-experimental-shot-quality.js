'use strict';
/** Isolated research-only shot quality, goalie and special-teams annotations. */
const {createExperimentalShotTimeline}=require('./hlm-experimental-shot-events');
const {activeSkaters,activeGoalie}=require('./hlm-experimental-player-shots');
function clamp(n,lo,hi){return Math.max(lo,Math.min(hi,n));}
function createExperimentalShotQuality(state,homeId,awayId,seed,playoff=false){
 const base=createExperimentalShotTimeline(state,homeId,awayId,seed,playoff);
 if(!base.researchReady)return {kind:'experimental-shot-quality',researchReady:false,blockers:base.blockers,events:null,teams:null,official:false,persistencePerformed:false};
 const roster={home:activeSkaters(state,homeId),away:activeSkaters(state,awayId)};
 const goalies={home:activeGoalie(state,homeId),away:activeGoalie(state,awayId)};
 const ratings={home:new Map(roster.home.map(p=>[p.id,p.ovr])),away:new Map(roster.away.map(p=>[p.id,p.ovr]))};
 const events=base.events.map(e=>{
  const opponent=e.side==='home'?'away':'home';
  const shooter=ratings[e.side].get(e.shooterId),goalie=goalies[opponent];
  const goalieRating=Number.isFinite(goalie.ovr)?goalie.ovr:70;
  const location=['slot','circle','point'][((e.eventId+seed)%3+3)%3];
  const locationFactor={slot:0.16,circle:0.09,point:0.045}[location];
  const shotQuality=Number(clamp(locationFactor+(shooter-75)*0.0015-(goalieRating-75)*0.001,0.01,0.35).toFixed(4));
  // Synthetic scores are already sampled; quality annotates, never rewrites, outcomes.
  return {...e,location,shotQuality,expectedGoalValue:shotQuality,goalieId:goalie.id,strength:'even',penaltyMinutes:0,rebound:false};
 });
 const teams={};
 for(const side of ['home','away']){
  const own=events.filter(e=>e.side===side),against=events.filter(e=>e.side!==side);
  teams[side]={teamId:side==='home'?homeId:awayId,shots:own.length,goals:own.filter(e=>e.goal).length,expectedGoals:Number(own.reduce((n,e)=>n+e.shotQuality,0).toFixed(4)),goalie:{playerId:goalies[side].id,shotsAgainst:against.length,goalsAgainst:against.filter(e=>e.goal).length,saves:against.filter(e=>!e.goal).length,expectedGoalsAgainst:Number(against.reduce((n,e)=>n+e.shotQuality,0).toFixed(4))},powerPlayOpportunities:0,powerPlayGoals:0,penaltyKillOpportunities:0,penaltyKillGoalsAgainst:0};
 }
 const consistent=base.audit.consistent&&['home','away'].every(side=>teams[side].shots===base.teams[side].shots&&teams[side].goals===base.teams[side].goals&&teams[side].goalie.saves===base.teams[side].goalie.saves)&&events.every(e=>e.shotQuality>=0.01&&e.shotQuality<=0.35&&e.penaltyMinutes===0&&e.strength==='even');
 if(!consistent)throw new Error('EXPERIMENTAL_SHOT_QUALITY_AUDIT_FAILED');
 return {kind:'experimental-shot-quality',researchReady:true,events,teams,audit:{consistent:true,eventsChecked:events.length},specialTeamsMode:'not-modeled',game:base.game,official:false,persistencePerformed:false};
}
module.exports={createExperimentalShotQuality};
