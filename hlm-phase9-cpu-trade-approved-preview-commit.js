'use strict';
const {prepareApprovedCPUTradeBatch}=require('./hlm-phase9-cpu-trade-batch-preview');
const {commitApprovedCPUTradeSequence}=require('./hlm-phase9-cpu-trade-source-slot-commit');
const {serializeGameState}=require('./hlm-game-state-serialization');
function fail(code,message){const e=new Error(message);e.code=code;throw e;}
function commitPreviewedCPUTradeBatch({repository,preview,steps,destinationSlotId,confirmCommit=false}={}){
 if(!preview||preview.kind!=='phase9-approved-cpu-trade-batch-preview'||preview.readyForExplicitCommit!==true)
  fail('CPU_PREVIEW_COMMIT_INVALID_PREVIEW','Verified CPU trade preview required');
 if(confirmCommit!==true)fail('CPU_PREVIEW_COMMIT_CONFIRMATION_REQUIRED','Explicit confirmation required');
 if(typeof destinationSlotId!=='string'||!destinationSlotId.trim())
  fail('CPU_PREVIEW_COMMIT_INVALID_DESTINATION','Destination save slot required');
 const fresh=prepareApprovedCPUTradeBatch({repository,sourceSlotId:preview.sourceSlotId,steps,expectedSourceFingerprint:preview.sourceFingerprint});
 if(fresh.candidateFingerprint!==preview.candidateFingerprint||
    fresh.stepCount!==preview.stepCount||
    JSON.stringify(fresh.transactionIds)!==JSON.stringify(preview.transactionIds))
  fail('CPU_PREVIEW_COMMIT_CHANGED','Trade sequence no longer matches reviewed preview');
 const commit=commitApprovedCPUTradeSequence({repository,sourceSlotId:preview.sourceSlotId,
  destinationSlotId,steps,expectedSourceFingerprint:preview.sourceFingerprint,confirmCommit:true});
 const loaded=repository.load(commit.destinationSlotId).state;
 if(serializeGameState(loaded)!==preview.candidateFingerprint)
  fail('CPU_PREVIEW_COMMIT_VERIFY_FAILED','Committed save differs from reviewed preview');
 return Object.freeze({kind:'phase9-previewed-cpu-trade-batch-committed',version:1,
  sourceSlotId:commit.sourceSlotId,destinationSlotId:commit.destinationSlotId,
  stepCount:commit.stepCount,verified:true,previewMatched:true,sourcePreserved:true,
  activeFranchiseSlotReplaced:false,productionCPUExecutionEnabled:false});
}
module.exports={commitPreviewedCPUTradeBatch};
