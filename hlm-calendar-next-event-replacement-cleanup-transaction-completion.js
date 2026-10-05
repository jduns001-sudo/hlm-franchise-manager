'use strict';

/**
 * Phase 3 Mission 151: next-event cleanup transaction completion.
 * Finalizes one exact independently verified Mission 150 cleanup chain.
 * Performs no persistence writes, deletion, checkpoint retirement, or advancement.
 */

function completionError(message){const error=new Error(message);error.code='NEXT_EVENT_CALENDAR_REPLACEMENT_CLEANUP_TRANSACTION_NOT_COMPLETE';return error;}

function completeNextEventCalendarReplacementCleanupTransaction(input={}){
 const verification=input.verification;
 if(
  !verification||verification.kind!=='next-event-calendar-replacement-cleanup-verification'||verification.version!==1||
  verification.verified!==true||verification.stagingSlotAbsent!==true||
  verification.targetMatchesAuthorizedCandidate!==true||verification.checkpointPreserved!==true||
  verification.lineageIntact!==true||!verification.targetEvent||verification.targetEvent.date!==verification.toDate||
  !verification.execution||!verification.readiness||!verification.authorization||!verification.completion||
  !verification.checkpoint||!verification.state
 )throw completionError('A verified next-event calendar replacement cleanup is required.');

 const execution=verification.execution,readiness=verification.readiness,authorization=verification.authorization,replacementCompletion=verification.completion;
 if(
  execution.kind!=='next-event-calendar-replacement-cleanup-execution'||execution.version!==1||
  execution.executed!==true||execution.verified!==true||execution.stagingSlotRemoved!==true||
  execution.checkpointPreserved!==true||execution.targetEvent!==verification.targetEvent||
  execution.readiness!==readiness||execution.authorization!==authorization||
  execution.completion!==replacementCompletion||execution.checkpoint!==verification.checkpoint||
  authorization.kind!=='next-event-calendar-replacement-cleanup-authorization'||authorization.version!==1||
  authorization.approved!==true||authorization.targetEvent!==verification.targetEvent||
  authorization.readiness!==readiness||authorization.completion!==replacementCompletion||
  authorization.checkpoint!==verification.checkpoint||
  readiness.kind!=='next-event-calendar-replacement-cleanup-readiness'||readiness.version!==1||
  readiness.ready!==true||readiness.targetEvent!==verification.targetEvent||
  readiness.completion!==replacementCompletion||readiness.checkpoint!==verification.checkpoint||
  replacementCompletion.kind!=='next-event-calendar-replacement-transaction-completion'||
  replacementCompletion.complete!==true||replacementCompletion.targetEvent!==verification.targetEvent||
  verification.candidateSlotId!==execution.candidateSlotId||verification.targetSlotId!==execution.targetSlotId||
  verification.storageKey!==execution.storageKey||verification.fromDate!==execution.fromDate||
  verification.toDate!==execution.toDate||verification.state.meta?.currentDate!==verification.toDate
 )throw completionError('Next-event cleanup verification lineage is inconsistent.');

 return Object.freeze({
  kind:'next-event-calendar-replacement-cleanup-transaction-completion',version:1,complete:true,
  cleanupPerformed:true,cleanupVerified:true,stagingSlotRemoved:true,targetPreserved:true,
  checkpointPreserved:true,lineageIntact:true,candidateSlotId:verification.candidateSlotId,
  targetSlotId:verification.targetSlotId,storageKey:verification.storageKey,fromDate:verification.fromDate,
  toDate:verification.toDate,targetEvent:verification.targetEvent,verification,execution,readiness,authorization,
  replacementCompletion,checkpoint:verification.checkpoint,state:verification.state
 });
}
module.exports={completeNextEventCalendarReplacementCleanupTransaction};
