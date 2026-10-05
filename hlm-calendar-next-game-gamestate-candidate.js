'use strict';

/**
 * Phase 3 Mission 161: next-game GameState calendar candidate.
 * Converts one exact Mission 160 verification into an isolated candidate state
 * by delegating the date-only change to the existing GameState boundary.
 * No activation, persistence, game simulation, event processing, or UI wiring.
 */
const {validateGameStateEnvelope}=require('./hlm-game-state');
const {createGameStateCalendarAdvancementCandidate}=require('./hlm-gamestate-calendar-advancement-candidate');
function candidateError(message){const error=new Error(message);error.code='INVALID_NEXT_GAME_GAMESTATE_CALENDAR_CANDIDATE';return error;}
function createNextGameGameStateCalendarCandidate(input={}){
 const state=input.state,verification=input.verification;
 if(!validateGameStateEnvelope(state).valid)throw candidateError('A valid source GameState envelope is required.');
 if(!verification||verification.kind!=='next-game-calendar-advancement-verification'||verification.version!==1||
 verification.verified!==true||verification.targetGameReached!==true||verification.lineageIntact!==true||
 !verification.targetGame||verification.targetGame.kind!=='calendar-event'||verification.targetGame.type!=='game'||
 verification.targetGame.date!==verification.toDate||!verification.advancementVerification||
 verification.advancementVerification.kind!=='calendar-advancement-verification'||
 verification.advancementVerification.verified!==true||
 verification.advancementVerification.fromDate!==verification.fromDate||
 verification.advancementVerification.toDate!==verification.toDate)
  throw candidateError('A valid exact Mission 160 next-game verification is required.');
 if(state.meta.currentDate!==verification.fromDate)throw candidateError('GameState current date does not match the verified next-game source date.');
 let calendarCandidate;
 try{calendarCandidate=createGameStateCalendarAdvancementCandidate({state,verification:verification.advancementVerification});}
 catch(_){throw candidateError('Underlying GameState calendar candidate could not be created.');}
 if(calendarCandidate.fromDate!==verification.fromDate||calendarCandidate.toDate!==verification.toDate||
 calendarCandidate.state.meta.currentDate!==verification.targetGame.date)
  throw candidateError('Underlying candidate does not match the verified target game.');
 return Object.freeze({kind:'next-game-gamestate-calendar-candidate',version:1,fromDate:verification.fromDate,toDate:verification.toDate,
  targetGame:verification.targetGame,verification,calendarCandidate,state:calendarCandidate.state});
}
module.exports={createNextGameGameStateCalendarCandidate};
