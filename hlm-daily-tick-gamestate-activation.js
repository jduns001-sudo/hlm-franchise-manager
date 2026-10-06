'use strict';

/**
 * Phase 3 Mission 196: isolated daily tick GameState calendar activation.
 * Returns the exact Mission 194 verified candidate state in-memory only after
 * Mission 195 authorization. No persistence, events, simulation, or UI.
 */
const {validateGameStateEnvelope}=require('./hlm-game-state');
const {assertDailyTickGameStateCalendarActivationAuthorized}=require('./hlm-daily-tick-gamestate-activation-authorization');

function activationError(message){const error=new Error(message);error.code='DAILY_TICK_GAMESTATE_CALENDAR_ACTIVATION_FAILED';return error;}

function activateDailyTickGameStateCalendarCandidate(input={}){
 const verification=input.verification,authorization=input.authorization;
 try{assertDailyTickGameStateCalendarActivationAuthorized(verification,authorization);}
 catch(_){throw activationError('Daily tick GameState activation is not authorized for the exact verification.');}

 const candidate=verification.candidate;
 if(!candidate||candidate.kind!=='daily-tick-gamestate-calendar-candidate'||candidate.version!==1||
 candidate.days!==1||candidate.state!==verification.state||
 candidate.eventsProcessed!==false||candidate.gameSimulationPerformed!==false||
 candidate.universeSystemsProcessed!==false||candidate.persistencePerformed!==false||
 !validateGameStateEnvelope(candidate.state).valid||
 candidate.state.meta.currentDate!==verification.toDate||
 verification.sourceState?.meta?.currentDate!==verification.fromDate)
  throw activationError('The authorized daily tick GameState candidate is invalid.');

 return Object.freeze({
  kind:'isolated-daily-tick-gamestate-calendar-activation',version:1,activated:true,
  eventsProcessed:false,gameSimulationPerformed:false,universeSystemsProcessed:false,persistencePerformed:false,
  fromDate:verification.fromDate,toDate:verification.toDate,days:1,
  verification,authorization,state:candidate.state
 });
}
module.exports={activateDailyTickGameStateCalendarCandidate};
