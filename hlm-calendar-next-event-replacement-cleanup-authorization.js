'use strict';

/**
 * Phase 3 Mission 148: next-event replacement cleanup authorization gate.
 * Authorizes cleanup of one exact Mission 147 readiness result.
 * Performs no persistence writes or deletion.
 */

function authorizationError(code,message){const error=new Error(message);error.code=code;return error;}

function assertCleanupReadiness(readiness){
 if(
  !readiness||readiness.kind!=='next-event-calendar-replacement-cleanup-readiness'||readiness.version!==1||
  readiness.ready!==true||readiness.cleanupAuthorized!==false||readiness.cleanupPerformed!==false||
  typeof readiness.candidateSlotId!=='string'||!readiness.candidateSlotId||
  typeof readiness.targetSlotId!=='string'||!readiness.targetSlotId||readiness.candidateSlotId===readiness.targetSlotId||
  typeof readiness.storageKey!=='string'||!readiness.storageKey||
  !readiness.targetEvent||readiness.targetEvent.date!==readiness.toDate||
  !readiness.completion||readiness.completion.kind!=='next-event-calendar-replacement-transaction-completion'||
  readiness.completion.complete!==true||readiness.completion.targetEvent!==readiness.targetEvent||
  readiness.completion.candidateSlotId!==readiness.candidateSlotId||
  readiness.completion.targetSlotId!==readiness.targetSlotId||
  readiness.completion.storageKey!==readiness.storageKey||
  readiness.completion.checkpoint!==readiness.checkpoint||
  readiness.fromDate!==readiness.completion.fromDate||readiness.toDate!==readiness.completion.toDate||
  readiness.requirements?.explicitCleanupAuthorizationRequired!==true||
  readiness.requirements?.targetMustRemainDurable!==true
 ){
  throw authorizationError('INVALID_NEXT_EVENT_CALENDAR_REPLACEMENT_CLEANUP_AUTHORIZATION',
   'A valid next-event calendar replacement cleanup readiness result is required.');
 }
 return readiness;
}

function createNextEventCalendarReplacementCleanupAuthorization(input={}){
 const readiness=assertCleanupReadiness(input.readiness);
 if(input.approved!==true){
  throw authorizationError('NEXT_EVENT_CALENDAR_REPLACEMENT_CLEANUP_NOT_APPROVED',
   'Next-event calendar replacement cleanup requires explicit approval.');
 }
 return Object.freeze({
  kind:'next-event-calendar-replacement-cleanup-authorization',version:1,approved:true,cleanupPerformed:false,
  candidateSlotId:readiness.candidateSlotId,targetSlotId:readiness.targetSlotId,storageKey:readiness.storageKey,
  fromDate:readiness.fromDate,toDate:readiness.toDate,targetEvent:readiness.targetEvent,
  readiness,completion:readiness.completion,checkpoint:readiness.checkpoint
 });
}

function assertNextEventCalendarReplacementCleanupAuthorized(readiness,authorization){
 const validated=assertCleanupReadiness(readiness);
 if(
  !authorization||authorization.kind!=='next-event-calendar-replacement-cleanup-authorization'||
  authorization.version!==1||authorization.approved!==true||authorization.cleanupPerformed!==false||
  authorization.readiness!==validated||authorization.completion!==validated.completion||
  authorization.checkpoint!==validated.checkpoint||authorization.targetEvent!==validated.targetEvent||
  authorization.candidateSlotId!==validated.candidateSlotId||authorization.targetSlotId!==validated.targetSlotId||
  authorization.storageKey!==validated.storageKey||authorization.fromDate!==validated.fromDate||
  authorization.toDate!==validated.toDate
 ){
  throw authorizationError('NEXT_EVENT_CALENDAR_REPLACEMENT_CLEANUP_AUTHORIZATION_MISMATCH',
   'Next-event cleanup authorization does not match the exact readiness result.');
 }
 return true;
}

module.exports={createNextEventCalendarReplacementCleanupAuthorization,assertNextEventCalendarReplacementCleanupAuthorized};
