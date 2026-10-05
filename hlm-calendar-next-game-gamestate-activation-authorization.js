'use strict';

/**
 * Phase 3 Mission 163: next-game GameState activation authorization.
 * Explicit permission only. Binds the exact Mission 162 candidate verification.
 * No state activation, persistence, game simulation, event processing, or UI.
 */
function authorizationError(message){const error=new Error(message);error.code='NEXT_GAME_GAMESTATE_CALENDAR_ACTIVATION_NOT_AUTHORIZED';return error;}
function assertNextGameCandidateVerification(verification){
 if(!verification||verification.kind!=='next-game-gamestate-calendar-candidate-verification'||verification.version!==1||
 verification.verified!==true||verification.dateOnlyChangeVerified!==true||verification.targetGameMatched!==true||
 typeof verification.fromDate!=='string'||typeof verification.toDate!=='string'||!verification.targetGame||
 verification.targetGame.kind!=='calendar-event'||verification.targetGame.type!=='game'||verification.targetGame.date!==verification.toDate||
 !verification.sourceState||!verification.candidate||verification.candidate.kind!=='next-game-gamestate-calendar-candidate'||
 verification.candidate.state!==verification.state||verification.candidate.targetGame!==verification.targetGame||
 verification.state?.meta?.currentDate!==verification.toDate||verification.sourceState?.meta?.currentDate!==verification.fromDate)
  throw authorizationError('A valid exact Mission 162 next-game candidate verification is required.');
 return verification;
}
function createNextGameGameStateCalendarActivationAuthorization(input={}){
 const verification=assertNextGameCandidateVerification(input.verification);
 if(input.approved!==true)throw authorizationError('Next-game GameState calendar activation requires explicit approval.');
 return Object.freeze({kind:'next-game-gamestate-calendar-activation-authorization',version:1,approved:true,
  fromDate:verification.fromDate,toDate:verification.toDate,targetGame:verification.targetGame,verification});
}
function assertNextGameGameStateCalendarActivationAuthorized(verification,authorization){
 const validated=assertNextGameCandidateVerification(verification);
 if(!authorization||authorization.kind!=='next-game-gamestate-calendar-activation-authorization'||authorization.version!==1||
 authorization.approved!==true||authorization.verification!==validated||authorization.targetGame!==validated.targetGame||
 authorization.fromDate!==validated.fromDate||authorization.toDate!==validated.toDate)
  throw authorizationError('Activation authorization does not match the exact verified next-game candidate.');
 return true;
}
module.exports={createNextGameGameStateCalendarActivationAuthorization,assertNextGameGameStateCalendarActivationAuthorized};
