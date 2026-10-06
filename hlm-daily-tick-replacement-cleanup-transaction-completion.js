'use strict';
function completionError(message){const error=new Error(message);error.code='DAILY_TICK_REPLACEMENT_CLEANUP_TRANSACTION_NOT_COMPLETE';return error;}
function completeDailyTickReplacementCleanupTransaction(input={}){
 const verification=input.verification;
 if(!verification||verification.kind!=='daily-tick-replacement-cleanup-verification'||verification.version!==1||
 verification.verified!==true||verification.stagingSlotAbsent!==true||verification.targetMatchesAuthorizedCandidate!==true||
 verification.checkpointPreserved!==true||verification.lineageIntact!==true||verification.days!==1||
 !verification.execution||!verification.readiness||!verification.authorization||!verification.completion||
 !verification.checkpoint||!verification.state)throw completionError('A verified daily tick replacement cleanup is required.');
 const {execution,readiness,authorization}=verification,replacementCompletion=verification.completion;
 if(execution.kind!=='daily-tick-replacement-cleanup-execution'||execution.executed!==true||execution.days!==1||
 execution.readiness!==readiness||execution.authorization!==authorization||execution.completion!==replacementCompletion||
 execution.checkpoint!==verification.checkpoint||authorization.kind!=='daily-tick-replacement-cleanup-authorization'||
 authorization.approved!==true||authorization.readiness!==readiness||authorization.completion!==replacementCompletion||
 authorization.checkpoint!==verification.checkpoint||readiness.kind!=='daily-tick-replacement-cleanup-readiness'||
 readiness.ready!==true||readiness.completion!==replacementCompletion||readiness.checkpoint!==verification.checkpoint||
 replacementCompletion.kind!=='daily-tick-replacement-transaction-completion'||replacementCompletion.complete!==true||
 verification.state.meta?.currentDate!==verification.toDate)
  throw completionError('Daily tick cleanup verification lineage is inconsistent.');
 return Object.freeze({kind:'daily-tick-replacement-cleanup-transaction-completion',version:1,complete:true,
  cleanupPerformed:true,cleanupVerified:true,stagingSlotRemoved:true,targetPreserved:true,checkpointPreserved:true,
  lineageIntact:true,days:1,candidateSlotId:verification.candidateSlotId,targetSlotId:verification.targetSlotId,
  storageKey:verification.storageKey,fromDate:verification.fromDate,toDate:verification.toDate,verification,execution,
  readiness,authorization,replacementCompletion,checkpoint:verification.checkpoint,state:verification.state});
}
module.exports={completeDailyTickReplacementCleanupTransaction};
