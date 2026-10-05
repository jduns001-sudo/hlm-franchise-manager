'use strict';

/**
 * Phase 3 Mission 193: daily tick GameState calendar candidate.
 * Converts one exact Mission 192 verification into an isolated candidate
 * GameState with only the verified one-day date change applied.
 * No activation, event processing, simulation, persistence, or UI behavior.
 */
const {validateGameStateEnvelope}=require('./hlm-game-state');
const {createGameStateCalendarAdvancementCandidate}=require('./hlm-gamestate-calendar-advancement-candidate');

function candidateError(message){const error=new Error(message);error.code='INVALID_DAILY_TICK_GAMESTATE_CALENDAR_CANDIDATE';return error;}

function createDailyTickGameStateCalendarCandidate(input={}){
 const state=input.state,verification=input.verification;
 if(!validateGameStateEnvelope(state).valid)throw candidateError('A valid source GameState envelope is required.');
 if(!verification||verification.kind!=='daily-tick-calendar-execution-verification'||verification.version!==1||
 verification.verified!==true||verification.exactlyOneDayAdvanced!==true||verification.sourceCalendarUnchanged!==true||
 verification.eventsUnprocessed!==true||verification.gameSimulationPerformed!==false||
 verification.universeSystemsProcessed!==false||verification.persistencePerformed!==false||
 verification.lineageIntact!==true||verification.days!==1||
 !verification.advancementVerification||verification.advancementVerification.kind!=='calendar-advancement-verification'||
 verification.advancementVerification.version!==1||verification.advancementVerification.verified!==true||
 verification.advancementVerification.fromDate!==verification.fromDate||
 verification.advancementVerification.toDate!==verification.toDate)
  throw candidateError('A valid exact Mission 192 daily tick verification is required.');
 if(state.meta.currentDate!==verification.fromDate)
  throw candidateError('GameState current date does not match the verified daily tick source date.');

 let calendarCandidate;
 try{calendarCandidate=createGameStateCalendarAdvancementCandidate({state,verification:verification.advancementVerification});}
 catch(_){throw candidateError('Underlying GameState calendar candidate could not be created.');}
 if(calendarCandidate.fromDate!==verification.fromDate||calendarCandidate.toDate!==verification.toDate||
 calendarCandidate.state.meta.currentDate!==verification.toDate)
  throw candidateError('Underlying candidate does not match the verified daily tick date.');

 return Object.freeze({
  kind:'daily-tick-gamestate-calendar-candidate',version:1,
  fromDate:verification.fromDate,toDate:verification.toDate,days:1,
  eventsProcessed:false,gameSimulationPerformed:false,universeSystemsProcessed:false,persistencePerformed:false,
  verification,calendarCandidate,state:calendarCandidate.state
 });
}
module.exports={createDailyTickGameStateCalendarCandidate};
