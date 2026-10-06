'use strict';

/**
 * Phase 3 Mission 197: isolated daily tick GameState activation verification.
 * Independently confirms Mission 196 preserved the exact Mission 194 candidate
 * and Mission 195 authorization lineage. No persistence, events, or simulation.
 */
const {validateGameStateEnvelope}=require('./hlm-game-state');
const {assertDailyTickGameStateCalendarActivationAuthorized}=require('./hlm-daily-tick-gamestate-activation-authorization');

function verificationError(message){const error=new Error(message);error.code='DAILY_TICK_GAMESTATE_CALENDAR_ACTIVATION_VERIFICATION_FAILED';return error;}

function verifyIsolatedDailyTickGameStateCalendarActivation(input={}){
 const activation=input.activation;
 if(!activation||activation.kind!=='isolated-daily-tick-gamestate-calendar-activation'||activation.version!==1||
 activation.activated!==true||activation.days!==1||activation.eventsProcessed!==false||
 activation.gameSimulationPerformed!==false||activation.universeSystemsProcessed!==false||
 activation.persistencePerformed!==false||!activation.verification||!activation.authorization||
 !validateGameStateEnvelope(activation.state).valid)
  throw verificationError('A valid Mission 196 isolated daily tick activation is required.');

 const verification=activation.verification;
 if(activation.authorization.verification!==verification)
  throw verificationError('Activation must retain the exact Mission 195 authorization object lineage.');
 try{assertDailyTickGameStateCalendarActivationAuthorized(verification,activation.authorization);}
 catch(_){throw verificationError('Activation authorization does not match its exact verified daily tick candidate.');}

 if(activation.fromDate!==verification.fromDate||activation.toDate!==verification.toDate||
 activation.state!==verification.state||activation.state!==verification.candidate.state||
 activation.state.meta.currentDate!==verification.toDate||
 verification.sourceState.meta.currentDate!==verification.fromDate||
 verification.days!==1||verification.eventsUnprocessed!==true||
 verification.gameSimulationPerformed!==false||verification.universeSystemsProcessed!==false||
 verification.persistencePerformed!==false)
  throw verificationError('Activated GameState does not match the exact authorized daily tick lineage.');

 return Object.freeze({
  kind:'isolated-daily-tick-gamestate-calendar-activation-verification',version:1,verified:true,
  exactlyOneDayVerified:true,candidateIdentityPreserved:true,authorizationLineageVerified:true,
  eventsUnprocessed:true,gameSimulationPerformed:false,universeSystemsProcessed:false,persistencePerformed:false,
  fromDate:activation.fromDate,toDate:activation.toDate,days:1,activation,state:activation.state
 });
}
module.exports={verifyIsolatedDailyTickGameStateCalendarActivation};
