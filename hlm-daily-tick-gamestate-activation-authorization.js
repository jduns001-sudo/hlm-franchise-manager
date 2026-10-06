'use strict';

/**
 * Phase 3 Mission 195: daily tick GameState activation authorization.
 * Explicit permission only. Binds one exact Mission 194 candidate verification.
 * No state activation, event processing, simulation, persistence, or UI.
 */
function authorizationError(message){const error=new Error(message);error.code='DAILY_TICK_GAMESTATE_CALENDAR_ACTIVATION_NOT_AUTHORIZED';return error;}

function assertDailyTickCandidateVerification(verification){
 if(!verification||verification.kind!=='daily-tick-gamestate-calendar-candidate-verification'||verification.version!==1||
 verification.verified!==true||verification.dateOnlyChangeVerified!==true||verification.exactlyOneDayVerified!==true||
 verification.sourceStatePreserved!==true||verification.eventsUnprocessed!==true||
 verification.gameSimulationPerformed!==false||verification.universeSystemsProcessed!==false||
 verification.persistencePerformed!==false||verification.days!==1||
 typeof verification.fromDate!=='string'||typeof verification.toDate!=='string'||
 !verification.sourceState||!verification.candidate||
 verification.candidate.kind!=='daily-tick-gamestate-calendar-candidate'||
 verification.candidate.state!==verification.state||
 verification.candidate.fromDate!==verification.fromDate||verification.candidate.toDate!==verification.toDate||
 verification.state?.meta?.currentDate!==verification.toDate||
 verification.sourceState?.meta?.currentDate!==verification.fromDate)
  throw authorizationError('A valid exact Mission 194 daily tick candidate verification is required.');
 return verification;
}

function createDailyTickGameStateCalendarActivationAuthorization(input={}){
 const verification=assertDailyTickCandidateVerification(input.verification);
 if(input.approved!==true)
  throw authorizationError('Daily tick GameState calendar activation requires explicit approval.');
 return Object.freeze({
  kind:'daily-tick-gamestate-calendar-activation-authorization',version:1,approved:true,activated:false,
  fromDate:verification.fromDate,toDate:verification.toDate,days:1,verification
 });
}

function assertDailyTickGameStateCalendarActivationAuthorized(verification,authorization){
 const validated=assertDailyTickCandidateVerification(verification);
 if(!authorization||authorization.kind!=='daily-tick-gamestate-calendar-activation-authorization'||
 authorization.version!==1||authorization.approved!==true||authorization.activated!==false||
 authorization.verification!==validated||authorization.fromDate!==validated.fromDate||
 authorization.toDate!==validated.toDate||authorization.days!==1)
  throw authorizationError('Activation authorization does not match the exact verified daily tick candidate.');
 return true;
}

module.exports={createDailyTickGameStateCalendarActivationAuthorization,assertDailyTickGameStateCalendarActivationAuthorized};
