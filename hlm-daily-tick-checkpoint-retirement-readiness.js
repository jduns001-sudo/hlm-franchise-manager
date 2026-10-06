'use strict';
function err(m){const e=new Error(m);e.code='DAILY_TICK_CHECKPOINT_RETIREMENT_NOT_READY';return e;}
function evaluateDailyTickCheckpointRetirementReadiness({completion}={}){
 if(!completion||completion.kind!=='daily-tick-replacement-cleanup-transaction-completion'||completion.complete!==true||
 !completion.cleanupVerified||!completion.stagingSlotRemoved||!completion.targetPreserved||!completion.checkpointPreserved||
 !completion.lineageIntact||completion.days!==1||!completion.checkpoint||!completion.state)throw err('Complete Daily Tick cleanup transaction required.');
 return Object.freeze({kind:'daily-tick-checkpoint-retirement-readiness',version:1,ready:true,retirementPerformed:false,days:1,
 candidateSlotId:completion.candidateSlotId,targetSlotId:completion.targetSlotId,storageKey:completion.storageKey,
 fromDate:completion.fromDate,toDate:completion.toDate,completion,checkpoint:completion.checkpoint,state:completion.state,
 requirements:Object.freeze({explicitAuthorizationRequired:true,durableTargetMustRemainVerified:true})});
}module.exports={evaluateDailyTickCheckpointRetirementReadiness};