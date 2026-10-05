'use strict';

/**
 * Phase 3 Mission 175: next-game existing-slot replacement authorization.
 * Authorizes one exact Mission 174 readiness result. Performs no writes.
 */
function authorizationError(code,message){const error=new Error(message);error.code=code;return error;}
function assertReplacementReadiness(readiness){
 if(!readiness||readiness.kind!=='existing-slot-next-game-calendar-replacement-readiness'||readiness.version!==1||
 readiness.ready!==true||readiness.replacementAuthorized!==false||readiness.replacementPerformed!==false||
 typeof readiness.candidateSlotId!=='string'||!readiness.candidateSlotId||
 typeof readiness.targetSlotId!=='string'||!readiness.targetSlotId||readiness.candidateSlotId===readiness.targetSlotId||
 typeof readiness.storageKey!=='string'||!readiness.storageKey||!readiness.targetGame||
 readiness.targetGame.kind!=='calendar-event'||readiness.targetGame.type!=='game'||readiness.targetGame.date!==readiness.toDate||
 !readiness.reloadVerification||readiness.reloadVerification.slotId!==readiness.candidateSlotId||
 readiness.reloadVerification.targetGame!==readiness.targetGame||!readiness.checkpoint||
 readiness.checkpoint.slotId!==readiness.targetSlotId||readiness.checkpoint.storageKey!==readiness.storageKey||
 readiness.fromDate!==readiness.reloadVerification.fromDate||readiness.toDate!==readiness.reloadVerification.toDate||
 readiness.requirements?.explicitReplacementAuthorizationRequired!==true||
 readiness.requirements?.verifyAfterReplacementRequired!==true||
 readiness.requirements?.restoreCheckpointOnFailureRequired!==true)
  throw authorizationError('INVALID_NEXT_GAME_CALENDAR_REPLACEMENT_AUTHORIZATION','A valid Mission 174 next-game replacement readiness result is required.');
 return readiness;
}
function createExistingSlotNextGameCalendarReplacementAuthorization(input={}){
 const readiness=assertReplacementReadiness(input.readiness);
 if(input.approved!==true)throw authorizationError('NEXT_GAME_CALENDAR_REPLACEMENT_NOT_APPROVED','Existing-slot next-game calendar replacement requires explicit approval.');
 return Object.freeze({kind:'existing-slot-next-game-calendar-replacement-authorization',version:1,approved:true,
  candidateSlotId:readiness.candidateSlotId,targetSlotId:readiness.targetSlotId,storageKey:readiness.storageKey,
  fromDate:readiness.fromDate,toDate:readiness.toDate,targetGame:readiness.targetGame,readiness,
  reloadVerification:readiness.reloadVerification,checkpoint:readiness.checkpoint,candidateState:readiness.reloadVerification.state});
}
function assertExistingSlotNextGameCalendarReplacementAuthorized(readiness,authorization){
 const validated=assertReplacementReadiness(readiness);
 if(!authorization||authorization.kind!=='existing-slot-next-game-calendar-replacement-authorization'||
 authorization.version!==1||authorization.approved!==true||authorization.readiness!==validated||
 authorization.reloadVerification!==validated.reloadVerification||authorization.checkpoint!==validated.checkpoint||
 authorization.targetGame!==validated.targetGame||authorization.candidateState!==validated.reloadVerification.state||
 authorization.candidateSlotId!==validated.candidateSlotId||authorization.targetSlotId!==validated.targetSlotId||
 authorization.storageKey!==validated.storageKey||authorization.fromDate!==validated.fromDate||authorization.toDate!==validated.toDate)
  throw authorizationError('NEXT_GAME_CALENDAR_REPLACEMENT_AUTHORIZATION_MISMATCH','Replacement authorization does not match the exact next-game readiness result.');
 return true;
}
module.exports={createExistingSlotNextGameCalendarReplacementAuthorization,assertExistingSlotNextGameCalendarReplacementAuthorized};
