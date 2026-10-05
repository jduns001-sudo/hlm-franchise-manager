'use strict';

/**
 * Phase 3 Mission 165: isolated next-game GameState activation verification.
 * Independently confirms Mission 164 preserved the exact Mission 162 candidate
 * and Mission 163 authorization lineage. No persistence or game simulation.
 */
const {validateGameStateEnvelope}=require('./hlm-game-state');
const {assertNextGameGameStateCalendarActivationAuthorized}=require('./hlm-calendar-next-game-gamestate-activation-authorization');
function verificationError(message){const error=new Error(message);error.code='NEXT_GAME_GAMESTATE_CALENDAR_ACTIVATION_VERIFICATION_FAILED';return error;}
function verifyIsolatedNextGameGameStateCalendarActivation(input={}){
 const activation=input.activation;
 if(!activation||activation.kind!=='isolated-next-game-gamestate-calendar-activation'||activation.version!==1||
 activation.activated!==true||!activation.verification||!activation.authorization||!activation.targetGame||
 activation.targetGame.kind!=='calendar-event'||activation.targetGame.type!=='game'||!validateGameStateEnvelope(activation.state).valid)
  throw verificationError('A valid Mission 164 isolated next-game activation is required.');
 const verification=activation.verification;
 if(activation.authorization.verification!==verification)
  throw verificationError('Activation must retain the exact Mission 163 authorization object lineage.');
 try{assertNextGameGameStateCalendarActivationAuthorized(verification,activation.authorization);}
 catch(_){throw verificationError('Activation authorization does not match its exact verified next-game candidate.');}
 if(activation.fromDate!==verification.fromDate||activation.toDate!==verification.toDate||
 activation.targetGame!==verification.targetGame||activation.targetGame.date!==activation.toDate||
 activation.state!==verification.state||activation.state!==verification.candidate.state||
 activation.state.meta.currentDate!==verification.toDate||verification.sourceState.meta.currentDate!==verification.fromDate)
  throw verificationError('Activated GameState does not match the exact authorized next-game lineage.');
 return Object.freeze({kind:'isolated-next-game-gamestate-calendar-activation-verification',version:1,verified:true,
  targetGameMatched:true,candidateIdentityPreserved:true,authorizationLineageVerified:true,
  fromDate:activation.fromDate,toDate:activation.toDate,targetGame:activation.targetGame,activation,state:activation.state});
}
module.exports={verifyIsolatedNextGameGameStateCalendarActivation};
