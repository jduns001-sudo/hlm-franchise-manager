'use strict';

/**
 * Phase 3 Mission 166: next-game calendar persistence readiness.
 * Readiness only. Performs no persistence writes.
 */
const {validateGameStateEnvelope}=require('./hlm-game-state');
function readinessError(message){const error=new Error(message);error.code='NEXT_GAME_CALENDAR_PERSISTENCE_NOT_READY';return error;}
function createNextGameCalendarPersistenceReadiness(input={}){
 const verification=input.verification;
 if(!verification||verification.kind!=='isolated-next-game-gamestate-calendar-activation-verification'||
 verification.version!==1||verification.verified!==true||verification.targetGameMatched!==true||
 verification.candidateIdentityPreserved!==true||verification.authorizationLineageVerified!==true||
 !verification.activation||!verification.targetGame||verification.targetGame.kind!=='calendar-event'||verification.targetGame.type!=='game')
  throw readinessError('A verified Mission 165 next-game GameState activation is required.');
 const activation=verification.activation;
 if(activation.kind!=='isolated-next-game-gamestate-calendar-activation'||activation.version!==1||
 activation.activated!==true||activation.state!==verification.state||activation.targetGame!==verification.targetGame||
 activation.fromDate!==verification.fromDate||activation.toDate!==verification.toDate||
 verification.targetGame.date!==verification.toDate||!validateGameStateEnvelope(activation.state).valid||
 activation.state.meta.currentDate!==verification.toDate)
  throw readinessError('Next-game activation is not eligible for persistence planning.');
 return Object.freeze({kind:'next-game-calendar-persistence-readiness',version:1,ready:true,
  fromDate:verification.fromDate,toDate:verification.toDate,targetGame:verification.targetGame,
  verification,candidateState:activation.state,requirements:Object.freeze({
   explicitPersistenceAuthorizationRequired:true,verifyAfterWriteRequired:true,rollbackOnFailureRequired:true
  })});
}
module.exports={createNextGameCalendarPersistenceReadiness};
