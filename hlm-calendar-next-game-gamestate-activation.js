'use strict';

/**
 * Phase 3 Mission 164: isolated next-game GameState calendar activation.
 * Returns the exact Mission 162 verified candidate state in-memory only after
 * Mission 163 authorization. No persistence, game simulation, events, or UI.
 */
const {validateGameStateEnvelope}=require('./hlm-game-state');
const {assertNextGameGameStateCalendarActivationAuthorized}=require('./hlm-calendar-next-game-gamestate-activation-authorization');
function activationError(message){const error=new Error(message);error.code='NEXT_GAME_GAMESTATE_CALENDAR_ACTIVATION_FAILED';return error;}
function activateNextGameGameStateCalendarCandidate(input={}){
 const verification=input.verification,authorization=input.authorization;
 try{assertNextGameGameStateCalendarActivationAuthorized(verification,authorization);}
 catch(_){throw activationError('Next-game GameState activation is not authorized for the exact verification.');}
 const candidate=verification.candidate;
 if(!candidate||candidate.kind!=='next-game-gamestate-calendar-candidate'||candidate.version!==1||
 candidate.state!==verification.state||candidate.targetGame!==verification.targetGame||
 candidate.targetGame?.kind!=='calendar-event'||candidate.targetGame.type!=='game'||
 !validateGameStateEnvelope(candidate.state).valid||candidate.state.meta.currentDate!==verification.toDate||
 verification.targetGame.date!==verification.toDate)
  throw activationError('The authorized next-game GameState candidate is invalid.');
 return Object.freeze({kind:'isolated-next-game-gamestate-calendar-activation',version:1,activated:true,
  fromDate:verification.fromDate,toDate:verification.toDate,targetGame:verification.targetGame,
  verification,authorization,state:candidate.state});
}
module.exports={activateNextGameGameStateCalendarCandidate};
