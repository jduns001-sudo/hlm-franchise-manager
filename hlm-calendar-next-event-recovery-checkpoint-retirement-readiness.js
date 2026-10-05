'use strict';

/**
 * Phase 3 Mission 152: next-event recovery checkpoint retirement readiness.
 * Read-only gate after Mission 151. It does not retire, delete, or alter the
 * preserved checkpoint or durable target.
 */

function readinessError(message){const error=new Error(message);error.code='NEXT_EVENT_CALENDAR_RECOVERY_CHECKPOINT_RETIREMENT_NOT_READY';return error;}

function evaluateNextEventCalendarRecoveryCheckpointRetirementReadiness(input={}){
 const completion=input.completion;
 if(
  !completion||completion.kind!=='next-event-calendar-replacement-cleanup-transaction-completion'||completion.version!==1||
  completion.complete!==true||completion.cleanupPerformed!==true||completion.cleanupVerified!==true||
  completion.stagingSlotRemoved!==true||completion.targetPreserved!==true||completion.checkpointPreserved!==true||
  completion.lineageIntact!==true||!completion.targetEvent||completion.targetEvent.date!==completion.toDate||
  !completion.verification||!completion.execution||!completion.readiness||!completion.authorization||
  !completion.replacementCompletion||!completion.checkpoint||!completion.state
 )throw readinessError('A complete Mission 151 next-event cleanup transaction is required.');

 const verification=completion.verification;
 if(
  verification.kind!=='next-event-calendar-replacement-cleanup-verification'||verification.version!==1||
  verification.verified!==true||verification.stagingSlotAbsent!==true||
  verification.targetMatchesAuthorizedCandidate!==true||verification.checkpointPreserved!==true||
  verification.lineageIntact!==true||verification.targetEvent!==completion.targetEvent||
  completion.execution!==verification.execution||completion.readiness!==verification.readiness||
  completion.authorization!==verification.authorization||completion.replacementCompletion!==verification.completion||
  completion.checkpoint!==verification.checkpoint||completion.state!==verification.state||
  completion.candidateSlotId!==verification.candidateSlotId||completion.targetSlotId!==verification.targetSlotId||
  completion.storageKey!==verification.storageKey||completion.fromDate!==verification.fromDate||
  completion.toDate!==verification.toDate||completion.state.meta?.currentDate!==completion.toDate
 )throw readinessError('Mission 151 next-event cleanup completion lineage is inconsistent.');

 return Object.freeze({
  kind:'next-event-calendar-recovery-checkpoint-retirement-readiness',version:1,ready:true,
  retirementAuthorized:false,retirementPerformed:false,checkpointStillPreserved:true,
  candidateSlotId:completion.candidateSlotId,targetSlotId:completion.targetSlotId,storageKey:completion.storageKey,
  fromDate:completion.fromDate,toDate:completion.toDate,targetEvent:completion.targetEvent,
  completion,verification,checkpoint:completion.checkpoint,state:completion.state,
  requirements:Object.freeze({explicitRetirementAuthorizationRequired:true,durableTargetMustRemainVerified:true})
 });
}
module.exports={evaluateNextEventCalendarRecoveryCheckpointRetirementReadiness};
