'use strict';
function err(m){const e=new Error(m);e.code='DAILY_TICK_CHECKPOINT_RETIREMENT_TRANSACTION_NOT_COMPLETE';return e;}
function completeDailyTickCheckpointRetirementTransaction({verification}={}){
 if(!verification||verification.kind!=='daily-tick-checkpoint-retirement-verification'||!verification.verified||!verification.checkpointRetirementVerified||
 !verification.rollbackAuthorityRetired||!verification.storagePreserved||!verification.durableTargetPreserved||!verification.stagingSlotAbsent||
 !verification.lineageIntact||verification.days!==1||!verification.execution||!verification.retiredCheckpoint||!verification.state)throw err('Verified retirement required.');
 const e=verification.execution;if(e.authorization!==verification.authorization||e.readiness!==verification.readiness||e.completion!==verification.completion||
 e.retiredCheckpoint!==verification.retiredCheckpoint||e.state!==verification.state)throw err('Retirement lineage inconsistent.');
 return Object.freeze({kind:'daily-tick-checkpoint-retirement-transaction-completion',version:1,complete:true,checkpointRetirementComplete:true,
 checkpointRetired:true,rollbackAuthorityRetired:true,retirementVerified:true,storagePreserved:true,durableTargetPreserved:true,stagingSlotAbsent:true,
 lineageIntact:true,days:1,candidateSlotId:verification.candidateSlotId,targetSlotId:verification.targetSlotId,storageKey:verification.storageKey,
 fromDate:verification.fromDate,toDate:verification.toDate,verification,execution:e,readiness:verification.readiness,authorization:verification.authorization,
 replacementCleanupCompletion:verification.completion,retiredCheckpoint:verification.retiredCheckpoint,state:verification.state});
}module.exports={completeDailyTickCheckpointRetirementTransaction};