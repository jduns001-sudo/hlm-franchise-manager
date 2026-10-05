'use strict';

/**
 * Phase 3 Mission 162: next-game GameState candidate verification.
 * Independently verifies the Mission 161 wrapper and delegates the date-only
 * state comparison to the existing GameState calendar candidate verifier.
 */
const {validateGameStateEnvelope}=require('./hlm-game-state');
const {verifyGameStateCalendarAdvancementCandidate}=require('./hlm-gamestate-calendar-candidate-verification');
function verificationError(message){const error=new Error(message);error.code='NEXT_GAME_GAMESTATE_CALENDAR_CANDIDATE_VERIFICATION_FAILED';return error;}
function verifyNextGameGameStateCalendarCandidate(input={}){
 const sourceState=input.sourceState,candidate=input.candidate;
 if(!validateGameStateEnvelope(sourceState).valid)throw verificationError('A valid source GameState envelope is required.');
 if(!candidate||candidate.kind!=='next-game-gamestate-calendar-candidate'||candidate.version!==1||
 !candidate.verification||candidate.verification.kind!=='next-game-calendar-advancement-verification'||
 candidate.verification.verified!==true||candidate.verification.targetGameReached!==true||
 candidate.verification.lineageIntact!==true||!candidate.calendarCandidate||
 candidate.state!==candidate.calendarCandidate.state||candidate.targetGame!==candidate.verification.targetGame||
 candidate.targetGame?.kind!=='calendar-event'||candidate.targetGame.type!=='game'||
 candidate.fromDate!==candidate.verification.fromDate||candidate.toDate!==candidate.verification.toDate||
 candidate.targetGame.date!==candidate.toDate)
  throw verificationError('A valid exact Mission 161 next-game candidate is required.');
 let calendarCandidateVerification;
 try{calendarCandidateVerification=verifyGameStateCalendarAdvancementCandidate({sourceState,candidate:candidate.calendarCandidate});}
 catch(_){throw verificationError('Underlying GameState calendar candidate verification failed.');}
 if(calendarCandidateVerification.fromDate!==candidate.fromDate||calendarCandidateVerification.toDate!==candidate.toDate||
 calendarCandidateVerification.candidate!==candidate.calendarCandidate||candidate.state.meta.currentDate!==candidate.targetGame.date)
  throw verificationError('Candidate does not match the verified next-game target.');
 return Object.freeze({kind:'next-game-gamestate-calendar-candidate-verification',version:1,verified:true,
  dateOnlyChangeVerified:true,targetGameMatched:true,fromDate:candidate.fromDate,toDate:candidate.toDate,
  targetGame:candidate.targetGame,sourceState,candidate,calendarCandidateVerification,state:candidate.state});
}
module.exports={verifyNextGameGameStateCalendarCandidate};
