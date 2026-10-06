'use strict';

/**
 * Phase 3 Mission 198: daily tick persistence readiness.
 * Read-only eligibility gate after exact Mission 197 activation verification.
 * Performs no storage writes.
 */
const {validateGameStateEnvelope}=require('./hlm-game-state');

function readinessError(message){const error=new Error(message);error.code='DAILY_TICK_PERSISTENCE_NOT_READY';return error;}

function createDailyTickPersistenceReadiness(input={}){
 const verification=input.verification;
 if(!verification||verification.kind!=='isolated-daily-tick-gamestate-calendar-activation-verification'||
 verification.version!==1||verification.verified!==true||verification.exactlyOneDayVerified!==true||
 verification.candidateIdentityPreserved!==true||verification.authorizationLineageVerified!==true||
 verification.eventsUnprocessed!==true||verification.gameSimulationPerformed!==false||
 verification.universeSystemsProcessed!==false||verification.persistencePerformed!==false||
 verification.days!==1||!verification.activation)
  throw readinessError('A verified Mission 197 daily tick GameState activation is required.');

 const activation=verification.activation;
 if(activation.kind!=='isolated-daily-tick-gamestate-calendar-activation'||activation.version!==1||
 activation.activated!==true||activation.days!==1||activation.state!==verification.state||
 activation.fromDate!==verification.fromDate||activation.toDate!==verification.toDate||
 activation.eventsProcessed!==false||activation.gameSimulationPerformed!==false||
 activation.universeSystemsProcessed!==false||activation.persistencePerformed!==false||
 !validateGameStateEnvelope(activation.state).valid||activation.state.meta.currentDate!==verification.toDate)
  throw readinessError('Daily tick activation is not eligible for persistence planning.');

 return Object.freeze({
  kind:'daily-tick-persistence-readiness',version:1,ready:true,
  fromDate:verification.fromDate,toDate:verification.toDate,days:1,
  verification,candidateState:activation.state,
  requirements:Object.freeze({
   explicitPersistenceAuthorizationRequired:true,
   verifyAfterWriteRequired:true,
   rollbackOnFailureRequired:true
  })
 });
}
module.exports={createDailyTickPersistenceReadiness};
