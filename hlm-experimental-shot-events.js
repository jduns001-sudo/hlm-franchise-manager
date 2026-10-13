'use strict';
/** Fictional shot event reconstruction from sampled period scores, never live gameplay. */
const {createExperimentalPlayerBoxScore,activeSkaters,activeGoalie,weightedSkater}=require('./hlm-experimental-player-shots');
const {nextRandom}=require('./hlm-experimental-hockey-periods');
const {deriveGameSeed}=require('./hlm-experimental-season-batch');
function periodDuration(period){return period.kind==='regulation'?1200:300;}
function buildShotEvents(state,box,seed){
 if(!box||!box.researchReady||!box.game||!box.teams)throw new Error('EXPERIMENTAL_BOX_NOT_READY');
 const next=nextRandom(deriveGameSeed(seed,11));
 const rosters={home:activeSkaters(state,box.game.homeTeamId),away:activeSkaters(state,box.game.awayTeamId)};
 if(!rosters.home.length||!rosters.away.length)throw new Error('MISSING_ACTIVE_SKATERS');
 const events=[];let eventId=0;
 for(const period of box.game.periods){
  const duration=periodDuration(period);
  for(const side of ['home','away']){
   const goals=period[side],players=rosters[side];
   const attempts=Math.max(goals,period.kind==='regulation'?Math.round(6+next()*7):goals);
   const times=Array.from({length:attempts},()=>1+Math.floor(next()*duration)).sort((a,b)=>a-b);
   const goalSlots=new Set();
   const slots=Array.from({length:attempts},(_,i)=>i);
   for(let i=slots.length-1;i>0;i--){const j=Math.floor(next()*(i+1));[slots[i],slots[j]]=[slots[j],slots[i]];}
   for(let i=0;i<goals;i++)goalSlots.add(slots[i]);
   for(let i=0;i<attempts;i++){
    const shooter=weightedSkater(players,next),isGoal=goalSlots.has(i);
    const helpers=players.filter(p=>p.id!==shooter.id);
    const assists=[];
    if(isGoal&&helpers.length&&next()<0.8){
     const first=helpers[Math.floor(next()*helpers.length)];assists.push(first.id);
     const second=helpers.filter(p=>p.id!==first.id);
     if(second.length&&next()<0.6)assists.push(second[Math.floor(next()*second.length)].id);
    }
    events.push({eventId:++eventId,period:period.period,kind:period.kind,second:times[i],side,teamId:side==='home'?box.game.homeTeamId:box.game.awayTeamId,shooterId:shooter.id,goal:isGoal,assistIds:assists});
   }
  }
 }
 events.sort((a,b)=>a.period-b.period||a.second-b.second||a.eventId-b.eventId);
 return events.map((e,i)=>({...e,eventId:i+1}));
}
function summarizeShotEvents(state,box,events){
 const teamIds={home:box.game.homeTeamId,away:box.game.awayTeamId};
 const teams={};
 for(const side of ['home','away']){
  const roster=activeSkaters(state,teamIds[side]);
  const goalie=activeGoalie(state,teamIds[side]);
  const players=roster.map(p=>({playerId:p.id,shots:0,goals:0,assists:0,points:0}));
  const lookup=new Map(players.map(p=>[p.playerId,p]));
  for(const e of events.filter(e=>e.side===side)){
   const shooter=lookup.get(e.shooterId);if(!shooter)throw new Error('UNKNOWN_SHOOTER');
   shooter.shots++;
   if(e.goal){shooter.goals++;shooter.points++;for(const id of e.assistIds){const a=lookup.get(id);if(!a||id===e.shooterId)throw new Error('INVALID_ASSIST');a.assists++;a.points++;}}
  }
  teams[side]={teamId:teamIds[side],shots:players.reduce((n,p)=>n+p.shots,0),goals:players.reduce((n,p)=>n+p.goals,0),players,goalie:{playerId:goalie.id,shotsAgainst:0,goalsAgainst:0,saves:0,savePercentage:null}};
 }
 for(const side of ['home','away']){
  const opp=teams[side==='home'?'away':'home'],g=teams[side].goalie;
  g.shotsAgainst=opp.shots;g.goalsAgainst=opp.goals;g.saves=g.shotsAgainst-g.goalsAgainst;
  g.savePercentage=g.shotsAgainst?g.saves/g.shotsAgainst:null;
 }
 return teams;
}
function auditShotEventTimeline(box,events,teams){
 if(!box||!box.researchReady||!Array.isArray(events)||!teams)return {consistent:false,reason:'NOT_READY'};
 const periods=box.game.periods;
 const valid=events.every((e,i)=>e.eventId===i+1&&(i===0||events[i-1].period<e.period||(events[i-1].period===e.period&&events[i-1].second<=e.second))&&periods.some(p=>p.period===e.period&&p.kind===e.kind)&&['home','away'].includes(e.side)&&e.teamId===box.game[e.side+'TeamId']&&Number.isSafeInteger(e.second)&&e.second>=1&&
  e.second<=periodDuration(periods.find(p=>p.period===e.period)||{kind:'regulation'})&&
  Array.isArray(e.assistIds)&&e.assistIds.length<=2&&new Set(e.assistIds).size===e.assistIds.length&&
  (!e.goal?e.assistIds.length===0:true))&&
  ['home','away'].every(side=>{
   const t=teams[side],es=events.filter(e=>e.side===side);
   return t.shots===es.length&&t.goals===es.filter(e=>e.goal).length&&
    t.goals===periods.reduce((n,p)=>n+p[side],0)&&
    t.players.reduce((n,p)=>n+p.shots,0)===t.shots&&
    t.players.reduce((n,p)=>n+p.goals,0)===t.goals&&
    t.players.reduce((n,p)=>n+p.assists,0)===es.reduce((n,e)=>n+e.assistIds.length,0)&&
    t.players.every(p=>p.points===p.goals+p.assists&&p.shots===es.filter(e=>e.shooterId===p.playerId).length&&p.goals===es.filter(e=>e.shooterId===p.playerId&&e.goal).length&&p.assists===es.filter(e=>e.assistIds.includes(p.playerId)).length)&&
    t.goalie.saves+t.goalie.goalsAgainst===t.goalie.shotsAgainst;
  });
 return {consistent:valid,eventsChecked:events.length,official:false};
}
function createExperimentalShotTimeline(state,homeTeamId,awayTeamId,seed,playoff=false){
 const box=createExperimentalPlayerBoxScore(state,homeTeamId,awayTeamId,seed,playoff);
 if(!box.researchReady)return {kind:'experimental-shot-timeline',researchReady:false,blockers:box.blockers.slice(),events:null,teams:null,audit:null,official:false,persistencePerformed:false};
 const events=buildShotEvents(state,box,seed),teams=summarizeShotEvents(state,box,events),audit=auditShotEventTimeline(box,events,teams);
 if(!audit.consistent)throw new Error('EXPERIMENTAL_EVENT_AUDIT_FAILED');
 return {kind:'experimental-shot-timeline',researchReady:true,blockers:[],events,teams,audit,game:box.game,official:false,persistencePerformed:false};
}
module.exports={periodDuration,buildShotEvents,summarizeShotEvents,auditShotEventTimeline,createExperimentalShotTimeline};
