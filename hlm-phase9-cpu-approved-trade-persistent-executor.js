'use strict';
// First explicitly authorized CPU transaction execution path. Writes a separate verified
// franchise save and never switches or mutates the active human franchise.
const {serializeGameState}=require('./hlm-game-state-serialization');
const {prepareApprovedCPUTradeBatch}=require('./hlm-phase9-cpu-trade-batch-preview');
const {commitPreviewedCPUTradeBatch}=require('./hlm-phase9-cpu-trade-approved-preview-commit');
function fail(code,message){const e=new Error(message);e.code=code;throw e;}
function executeApprovedCPUTradeBatch({repository,sourceSlotId,destinationSlotId,steps,reviewedPreview,confirmExecution=false}={}){
 if(confirmExecution!==true)fail('CPU_EXECUTOR_APPROVAL_REQUIRED','Explicit human GM execution approval required');
 if(!reviewedPreview||reviewedPreview.kind!=='phase9-approved-cpu-trade-batch-preview')
  fail('CPU_EXECUTOR_REVIEW_REQUIRED','Reviewed trade preview required');
 if(reviewedPreview.sourceSlotId!==sourceSlotId)
  fail('CPU_EXECUTOR_SOURCE_MISMATCH','Execution source must match reviewed preview');
 const fresh=prepareApprovedCPUTradeBatch({repository,sourceSlotId,steps,expectedSourceFingerprint:reviewedPreview.sourceFingerprint});
 if(fresh.candidateFingerprint!==reviewedPreview.candidateFingerprint||
    fresh.stepCount!==reviewedPreview.stepCount||
    JSON.stringify(fresh.transactionIds)!==JSON.stringify(reviewedPreview.transactionIds))
  fail('CPU_EXECUTOR_PREVIEW_CHANGED','Trade execution differs from approved preview');
 const commit=commitPreviewedCPUTradeBatch({repository,preview:reviewedPreview,steps,destinationSlotId,confirmCommit:true});
 const persisted=repository.load(destinationSlotId).state;
 if(serializeGameState(persisted)!==reviewedPreview.candidateFingerprint)
  fail('CPU_EXECUTOR_PERSISTED_MISMATCH','Persisted execution differs from approved preview');
 return Object.freeze({kind:'phase9-approved-cpu-trade-persistent-execution',version:1,
  sourceSlotId,destinationSlotId,transactionIds:fresh.transactionIds,
  executed:true,persisted:true,verified:true,sourcePreserved:commit.sourcePreserved,
  activeFranchiseSlotReplaced:false,autonomousExecutionEnabled:false,
  requiresHumanGMApproval:true});
}
module.exports={executeApprovedCPUTradeBatch};
