'use strict';

/**
 * Phase 3 Mission 212: daily tick replacement cleanup authorization.
 * Authorizes cleanup of one exact Mission 211 readiness result.
 * Performs no persistence writes or deletion.
 */
function authorizationError(code,message){const error=new Error(message);error.code=code;return error;}

function assertCleanupReadiness(readiness){
 if(!readiness||readiness.kind!=='daily-tick-replacement-cleanup-readiness'||readiness.version!==1||
 readiness.ready!==true||readiness.cleanupAuthorized!==false||readiness.cleanupPerformed!==false||
 readiness.days!==1||typeof readiness.candidateSlotId!=='string'||!readiness.candidateSlotId||
 typeof readiness.targetSlotId!=='string'||!readiness.targetSlotId||readiness.candidateSlotId===readiness.targetSlotId||
 typeof readiness.storageKey!=='string'||!readiness.storageKey||!readiness.completion||
 readiness.completion.kind!=='daily-tick-replacement-transaction-completion'||readiness.completion.complete!==true||
 readiness.completion.days!==1||readiness.completion.candidateSlotId!==readiness.candidateSlotId||
 readiness.completion.targetSlotId!==readiness.targetSlotId||readiness.completion.storageKey!==readiness.storageKey||
 readiness.completion.checkpoint!==readiness.checkpoint||readiness.fromDate!==readiness.completion.fromDate||
 readiness.toDate!==readiness.completion.toDate||
 readiness.requirements?.explicitCleanupAuthorizationRequired!==true||
 readiness.requirements?.targetMustRemainDurable!==true)
  throw authorizationError('INVALID_DAILY_TICK_REPLACEMENT_CLEANUP_AUTHORIZATION','A valid Mission 211 daily tick replacement cleanup readiness result is required.');
 return readiness;
}

function createDailyTickReplacementCleanupAuthorization(input={}){
 const readiness=assertCleanupReadiness(input.readiness);
 if(input.approved!==true)
  throw authorizationError('DAILY_TICK_REPLACEMENT_CLEANUP_NOT_APPROVED','Daily tick replacement cleanup requires explicit approval.');
 return Object.freeze({
  kind:'daily-tick-replacement-cleanup-authorization',version:1,approved:true,cleanupPerformed:false,days:1,
  candidateSlotId:readiness.candidateSlotId,targetSlotId:readiness.targetSlotId,storageKey:readiness.storageKey,
  fromDate:readiness.fromDate,toDate:readiness.toDate,readiness,completion:readiness.completion,checkpoint:readiness.checkpoint
 });
}

function assertDailyTickReplacementCleanupAuthorized(readiness,authorization){
 const validated=assertCleanupReadiness(readiness);
 if(!authorization||authorization.kind!=='daily-tick-replacement-cleanup-authorization'||
 authorization.version!==1||authorization.approved!==true||authorization.cleanupPerformed!==false||
 authorization.days!==1||authorization.readiness!==validated||authorization.completion!==validated.completion||
 authorization.checkpoint!==validated.checkpoint||authorization.candidateSlotId!==validated.candidateSlotId||
 authorization.targetSlotId!==validated.targetSlotId||authorization.storageKey!==validated.storageKey||
 authorization.fromDate!==validated.fromDate||authorization.toDate!==validated.toDate)
  throw authorizationError('DAILY_TICK_REPLACEMENT_CLEANUP_AUTHORIZATION_MISMATCH','Daily tick cleanup authorization does not match the exact readiness result.');
 return true;
}
module.exports={createDailyTickReplacementCleanupAuthorization,assertDailyTickReplacementCleanupAuthorized};
