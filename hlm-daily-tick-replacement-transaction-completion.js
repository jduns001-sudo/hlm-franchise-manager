'use strict';

/**
 * Phase 3 Mission 210: daily tick replacement transaction completion.
 * Finalizes one exact independently verified Mission 209 replacement chain.
 * Performs no persistence writes or cleanup.
 */
function completionError(message){const error=new Error(message);error.code='DAILY_TICK_REPLACEMENT_TRANSACTION_NOT_COMPLETE';return error;}

function completeDailyTickReplacementTransaction(input={}){
 const verification=input.verification;
 if(!verification||verification.kind!=='existing-slot-daily-tick-replacement-verification'||
 verification.version!==1||verification.verified!==true||verification.exactlyOneDayVerified!==true||
 verification.candidateSlotPreserved!==true||verification.days!==1||!verification.execution||
 !verification.authorization||!verification.checkpoint||!verification.state)
  throw completionError('A verified existing-slot daily tick replacement is required.');

 const execution=verification.execution,authorization=verification.authorization;
 if(execution.kind!=='existing-slot-daily-tick-replacement-execution'||execution.version!==1||
 execution.executed!==true||execution.verified!==true||execution.rolledBack!==false||execution.days!==1||
 execution.authorization!==authorization||execution.checkpoint!==verification.checkpoint||
 authorization.approved!==true||authorization.days!==1||authorization.candidateState!==execution.candidateState||
 verification.candidateSlotId!==execution.candidateSlotId||verification.targetSlotId!==execution.targetSlotId||
 verification.storageKey!==execution.storageKey||verification.fromDate!==execution.fromDate||
 verification.toDate!==execution.toDate||verification.state.meta?.currentDate!==verification.toDate)
  throw completionError('Daily tick replacement verification lineage is inconsistent.');

 return Object.freeze({
  kind:'daily-tick-replacement-transaction-completion',version:1,complete:true,
  durableVerificationComplete:true,cleanupPerformed:false,checkpointPreserved:true,stagingSlotPreserved:true,
  exactlyOneDayComplete:true,candidateSlotId:verification.candidateSlotId,targetSlotId:verification.targetSlotId,
  storageKey:verification.storageKey,fromDate:verification.fromDate,toDate:verification.toDate,days:1,
  verification,execution,authorization,checkpoint:verification.checkpoint,state:verification.state
 });
}
module.exports={completeDailyTickReplacementTransaction};
