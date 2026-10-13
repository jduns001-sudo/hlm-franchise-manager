'use strict';
/** Read-only synthetic game recap; no actual game play-by-play or save mutations. */
const {createExperimentalPenaltyClockAudit}=require('./hlm-experimental-penalty-clocks');
function createExperimentalGameRecap(state,homeId,awayId,seed,playoff=false){
 const base=createExperimentalPenaltyClockAudit(state,homeId,awayId,seed,playoff);
 if(!base.researchReady)return {kind:'experimental-game-recap',researchReady:false,blockers:base.blockers,periods:null,teams:null,official:false,persistencePerformed:false};
 const periods=base.game.periods.map(p=>{
  const events=base.events.filter(e=>e.period===p.period);
  const bySide=side=>events.filter(e=>e.side===side);
  return {period:p.period,kind:p.kind,homeGoals:p.home,awayGoals:p.away,homeShots:bySide('home').length,awayShots:bySide('away').length,homePowerPlayGoals:bySide('home').filter(e=>e.goal&&e.strength==='power-play').length,awayPowerPlayGoals:bySide('away').filter(e=>e.goal&&e.strength==='power-play').length,homeExpectedGoals:Number(bySide('home').reduce((n,e)=>n+e.shotQuality,0).toFixed(4)),awayExpectedGoals:Number(bySide('away').reduce((n,e)=>n+e.shotQuality,0).toFixed(4))};
 });
 const home=base.teams.home,away=base.teams.away;
 const total=(key)=>periods.reduce((n,p)=>n+p[key],0);
 const summary={home:{teamId:home.teamId,goals:total('homeGoals'),shots:total('homeShots'),powerPlayGoals:total('homePowerPlayGoals'),expectedGoals:Number(base.events.filter(e=>e.side==='home').reduce((n,e)=>n+e.shotQuality,0).toFixed(4)),goalie:{...home.goalie}},away:{teamId:away.teamId,goals:total('awayGoals'),shots:total('awayShots'),powerPlayGoals:total('awayPowerPlayGoals'),expectedGoals:Number(base.events.filter(e=>e.side==='away').reduce((n,e)=>n+e.shotQuality,0).toFixed(4)),goalie:{...away.goalie}}};
 const valid=base.audit.consistent&&summary.home.goals===home.goals&&summary.away.goals===away.goals&&summary.home.shots===home.shots&&summary.away.shots===away.shots&&summary.home.powerPlayGoals===home.powerPlayGoals&&summary.away.powerPlayGoals===away.powerPlayGoals&&summary.home.goalie.saves+summary.home.goalie.goalsAgainst===summary.home.goalie.shotsAgainst&&summary.away.goalie.saves+summary.away.goalie.goalsAgainst===summary.away.goalie.shotsAgainst;
 if(!valid)throw new Error('EXPERIMENTAL_GAME_RECAP_AUDIT_FAILED');
 return {kind:'experimental-game-recap',researchReady:true,periods,teams:summary,penalties:base.penalties.map(p=>({...p})),eventCount:base.events.length,audit:{consistent:true,periodsChecked:periods.length},game:base.game,official:false,persistencePerformed:false};
}
module.exports={createExperimentalGameRecap};
