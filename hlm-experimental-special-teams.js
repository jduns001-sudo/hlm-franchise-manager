'use strict';
/** Research-only deterministic special-teams opportunities, not real penalties or game results. */
const {createExperimentalShotQuality}=require('./hlm-experimental-shot-quality');
function createExperimentalSpecialTeams(state,homeId,awayId,seed,playoff=false){
 const base=createExperimentalShotQuality(state,homeId,awayId,seed,playoff);
 if(!base.researchReady)return {kind:'experimental-special-teams',researchReady:false,blockers:base.blockers,events:null,teams:null,official:false,persistencePerformed:false};
 const events=base.events.map(e=>({...e}));
 const penalties=[];
 // Fictional penalty windows are observational annotations only, never rewrite inherited goals.
 for(const period of base.game.periods.filter(p=>p.kind==='regulation')){
  const penalizedSide=(period.period+seed)%2===0?'home':'away';
  const start=180+((period.period*173+seed)%600);
  penalties.push({period:period.period,second:start,penalizedSide,durationSeconds:120,kind:'minor',official:false});
 }
 for(const e of events){
  const active=penalties.find(p=>p.period===e.period&&e.second>=p.second&&e.second<p.second+p.durationSeconds);
  e.strength=active?(e.side===active.penalizedSide?'short-handed':'power-play'):'even';
  e.penaltyMinutes=0;
 }
 const teams={};
 for(const side of ['home','away']){
  const own=events.filter(e=>e.side===side);
  const against=events.filter(e=>e.side!==side);
  const pp=own.filter(e=>e.strength==='power-play');
  const pk=against.filter(e=>e.strength==='power-play');
  teams[side]={teamId:base.teams[side].teamId,shots:own.length,goals:own.filter(e=>e.goal).length,expectedGoals:base.teams[side].expectedGoals,goalie:{...base.teams[side].goalie},powerPlayOpportunities:penalties.filter(p=>p.penalizedSide!==side).length,powerPlayShots:pp.length,powerPlayGoals:pp.filter(e=>e.goal).length,penaltyKillOpportunities:penalties.filter(p=>p.penalizedSide===side).length,penaltyKillShotsAgainst:pk.length,penaltyKillGoalsAgainst:pk.filter(e=>e.goal).length};
 }
 const valid=events.length===base.events.length&&['home','away'].every(side=>teams[side].shots===base.teams[side].shots&&teams[side].goals===base.teams[side].goals&&teams[side].powerPlayGoals<=teams[side].powerPlayShots&&teams[side].penaltyKillGoalsAgainst<=teams[side].penaltyKillShotsAgainst)&&events.every(e=>['even','power-play','short-handed'].includes(e.strength));
 if(!valid)throw new Error('EXPERIMENTAL_SPECIAL_TEAMS_AUDIT_FAILED');
 return {kind:'experimental-special-teams',researchReady:true,events,penalties,teams,audit:{consistent:true,eventsChecked:events.length},specialTeamsMode:'synthetic-annotation',game:base.game,official:false,persistencePerformed:false};
}
module.exports={createExperimentalSpecialTeams};
