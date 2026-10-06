'use strict';

/**
 * Phase 3 Mission 207: daily tick existing-slot replacement authorization.
 * Authorizes one exact Mission 206 readiness result. Performs no writes.
 */
function authorizationError(code,message){const error=new Error(message);error.code=code;return error;}
function assertReplacementReadiness(readiness){
 if(!readiness||readiness.kind!=='existing-slot-daily-tick-replacement-readiness'||readiness.version!==1||
 readiness.ready!==true||readiness.replacementAuthorized!==false||readiness.replacementPerformed!==false||
 readiness.days!==1||typeof readiness.candidateSlotId!=='string'||!readiness.candidateSlotId||
 typeof readiness.targetSlotId!=='string'||!readiness.targetSlotId||readiness.candidateSlotId===readiness.targetSlotId||
 typeof readiness.storageKey!=='string'||!readiness.storageKey||!readiness.reloadVerification||
 readiness.reloadVerification.slotId!==readiness.candidateSlotId||readiness.reloadVerification.days!==1||
 readiness.reloadVerification.exactlyOneDayVerified!==true||readiness.reloadVerification.eventsUnprocessed!==true||
 readiness.reloadVerification.gameSimulationPerformed!==false||readiness.reloadVerification.universeSystemsProcessed!==false||
 !readiness.checkpoint||readiness.checkpoint.slotId!==readiness.targetSlotId||
 readiness.checkpoint.storageKey!==readiness.storageKey||readiness.fromDate!==readiness.reloadVerification.fromDate||
 readiness.toDate!==readiness.reloadVerification.toDate||
 readiness.requirements?.explicitReplacementAuthorizationRequired!==true||
 readiness.requirements?.verifyAfterReplacementRequired!==true||
 readiness.requirements?.restoreCheckpointOnFailureRequired!==true)
  throw authorizationError('INVALID_DAILY_TICK_REPLACEMENT_AUTHORIZATION','A valid Mission 206 daily tick replacement readiness result is required.');
 return readiness;
}
function createExistingSlotDailyTickReplacementAuthorization(input={}){
 const readiness=assertReplacementReadiness(input.readiness);
 if(input.approved!==true)
  throw authorizationError('DAILY_TICK_REPLACEMENT_NOT_APPROVED','Existing-slot daily tick replacement requires explicit approval.');
 return Object.freeze({
  kind:'existing-slot-daily-tick-replacement-authorization',version:1,approved:true,days:1,
  candidateSlotId:readiness.candidateSlotId,targetSlotId:readiness.targetSlotId,storageKey:readiness.storageKey,
  fromDate:readiness.fromDate,toDate:readiness.toDate,readiness,reloadVerification:readiness.reloadVerification,
  checkpoint:readiness.checkpoint,candidateState:readiness.reloadVerification.state
 });
}
function assertExistingSlotDailyTickReplacementAuthorized(readiness,authorization){
 const validated=assertReplacementReadiness(readiness);
 if(!authorization||authorization.kind!=='existing-slot-daily-tick-replacement-authorization'||
 authorization.version!==1||authorization.approved!==true||authorization.days!==1||
 authorization.readiness!==validated||authorization.reloadVerification!==validated.reloadVerification||
 authorization.checkpoint!==validated.checkpoint||authorization.candidateState!==validated.reloadVerification.state||
 authorization.candidateSlotId!==validated.candidateSlotId||authorization.targetSlotId!==validated.targetSlotId||
 authorization.storageKey!==validated.storageKey||authorization.fromDate!==validated.fromDate||
 authorization.toDate!==validated.toDate)
  throw authorizationError('DAILY_TICK_REPLACEMENT_AUTHORIZATION_MISMATCH','Replacement authorization does not match the exact daily tick readiness result.');
 return true;
}
module.exports={createExistingSlotDailyTickReplacementAuthorization,assertExistingSlotDailyTickReplacementAuthorized};
