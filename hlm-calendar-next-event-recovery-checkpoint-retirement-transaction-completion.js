'use strict';
/**
 * Phase 3 Mission 156: next-event recovery checkpoint retirement transaction completion.
 * Finalizes one exact independently verified Mission 155 chain. No writes, deletion,
 * calendar advancement, event execution, or UI wiring.
 */
function completionError(message){const error=new Error(message);error.code='NEXT_EVENT_CALENDAR_RECOVERY_CHECKPOINT_RETIREMENT_TRANSACTION_NOT_COMPLETE';return error;}
function completeNextEventCalendarRecoveryCheckpointRetirementTransaction(input={}){
 const verification=input.verification;
 if(!verification||verification.kind!=='next-event-calendar-recovery-checkpoint-retirement-verification'||verification.version!==1||
 verification.verified!==true||verification.checkpointRetirementVerified!==true||verification.rollbackAuthorityRetired!==true||
 verification.storagePreserved!==true||verification.durableTargetPreserved!==true||verification.stagingSlotAbsent!==true||
 verification.lineageIntact!==true||!verification.targetEvent||verification.targetEvent.date!==verification.toDate||
 !verification.execution||!verification.readiness||!verification.authorization||!verification.completion||
 !verification.retiredCheckpoint||!verification.state)throw completionError('A verified Mission 155 next-event checkpoint retirement is required.');
 const execution=verification.execution,readiness=verification.readiness,authorization=verification.authorization;
 if(execution.kind!=='next-event-calendar-recovery-checkpoint-retirement-execution'||execution.version!==1||
 execution.executed!==true||execution.verified!==true||execution.checkpointRetired!==true||
 execution.rollbackAuthorityRetired!==true||execution.storageDeleted!==false||execution.durableTargetPreserved!==true||
 execution.stagingSlotAbsent!==true||execution.targetEvent!==verification.targetEvent||execution.readiness!==readiness||
 execution.authorization!==authorization||execution.completion!==verification.completion||
 execution.retiredCheckpoint!==verification.retiredCheckpoint||execution.state!==verification.state||
 authorization.kind!=='next-event-calendar-recovery-checkpoint-retirement-authorization'||authorization.version!==1||
 authorization.approved!==true||authorization.executed!==false||authorization.targetEvent!==verification.targetEvent||
 authorization.readiness!==readiness||authorization.completion!==verification.completion||
 authorization.checkpoint!==verification.retiredCheckpoint||
 readiness.kind!=='next-event-calendar-recovery-checkpoint-retirement-readiness'||readiness.version!==1||
 readiness.ready!==true||readiness.targetEvent!==verification.targetEvent||readiness.completion!==verification.completion||
 readiness.checkpoint!==verification.retiredCheckpoint||verification.candidateSlotId!==execution.candidateSlotId||
 verification.targetSlotId!==execution.targetSlotId||verification.storageKey!==execution.storageKey||
 verification.fromDate!==execution.fromDate||verification.toDate!==execution.toDate||
 verification.state.meta?.currentDate!==verification.toDate)throw completionError('Next-event checkpoint retirement verification lineage is inconsistent.');
 return Object.freeze({kind:'next-event-calendar-recovery-checkpoint-retirement-transaction-completion',version:1,complete:true,
 checkpointRetirementComplete:true,checkpointRetired:true,rollbackAuthorityRetired:true,retirementVerified:true,
 storagePreserved:true,durableTargetPreserved:true,stagingSlotAbsent:true,lineageIntact:true,
 candidateSlotId:verification.candidateSlotId,targetSlotId:verification.targetSlotId,storageKey:verification.storageKey,
 fromDate:verification.fromDate,toDate:verification.toDate,targetEvent:verification.targetEvent,verification,execution,
 readiness,authorization,replacementCleanupCompletion:verification.completion,retiredCheckpoint:verification.retiredCheckpoint,
 state:verification.state});
}
module.exports={completeNextEventCalendarRecoveryCheckpointRetirementTransaction};
