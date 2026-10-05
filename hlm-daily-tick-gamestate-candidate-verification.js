'use strict';

/**
 * Phase 3 Mission 194: daily tick GameState candidate verification.
 * Independently verifies the Mission 193 wrapper and delegates the date-only
 * state comparison to the existing GameState calendar candidate verifier.
 */
const {validateGameStateEnvelope}=require('./hlm-game-state');
const {verifyGameStateCalendarAdvancementCandidate}=require('./hlm-gamestate-calendar-candidate-verification');

function verificationError(message){const error=new Error(message);error.code='DAILY_TICK_GAMESTATE_CALENDAR_CANDIDATE_VERIFICATION_FAILED';return error;}

function verifyDailyTickGameStateCalendarCandidate(input={}){
 const sourceState=input.sourceState,candidate=input.candidate;
 if(!validateGameStateEnvelope(sourceState).valid)
  throw verificationError('A valid source GameState envelope is required.');
 if(!candidate||candidate.kind!=='daily-tick-gamestate-calendar-candidate'||candidate.version!==1||
 candidate.days!==1||candidate.eventsProcessed!==false||candidate.gameSimulationPerformed!==false||
 candidate.universeSystemsProcessed!==false||candidate.persistencePerformed!==false||
 !candidate.verification||candidate.verification.kind!=='daily-tick-calendar-execution-verification'||
 candidate.verification.version!==1||candidate.verification.verified!==true||
 candidate.verification.exactlyOneDayAdvanced!==true||candidate.verification.sourceCalendarUnchanged!==true||
 candidate.verification.eventsUnprocessed!==true||candidate.verification.lineageIntact!==true||
 !candidate.calendarCandidate||candidate.state!==candidate.calendarCandidate.state||
 candidate.fromDate!==candidate.verification.fromDate||candidate.toDate!==candidate.verification.toDate)
  throw verificationError('A valid exact Mission 193 daily tick candidate is required.');

 let calendarCandidateVerification;
 try{calendarCandidateVerification=verifyGameStateCalendarAdvancementCandidate({
  sourceState,candidate:candidate.calendarCandidate
 });}catch(_){throw verificationError('Underlying GameState calendar candidate verification failed.');}

 if(calendarCandidateVerification.fromDate!==candidate.fromDate||
 calendarCandidateVerification.toDate!==candidate.toDate||
 calendarCandidateVerification.candidate!==candidate.calendarCandidate||
 sourceState.meta.currentDate!==candidate.fromDate||candidate.state.meta.currentDate!==candidate.toDate)
  throw verificationError('Candidate does not match the verified one-day Daily Tick transition.');

 return Object.freeze({
  kind:'daily-tick-gamestate-calendar-candidate-verification',version:1,verified:true,
  dateOnlyChangeVerified:true,exactlyOneDayVerified:true,sourceStatePreserved:true,
  eventsUnprocessed:true,gameSimulationPerformed:false,universeSystemsProcessed:false,persistencePerformed:false,
  fromDate:candidate.fromDate,toDate:candidate.toDate,days:1,
  sourceState,candidate,calendarCandidateVerification,state:candidate.state
 });
}
module.exports={verifyDailyTickGameStateCalendarCandidate};
