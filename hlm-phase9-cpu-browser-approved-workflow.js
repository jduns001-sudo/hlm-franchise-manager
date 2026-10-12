'use strict';
// Browser-facing orchestration without changing legacy Front Office source selection.
const {createBrowserSaveAdapter}=require('./hlm-browser-save-adapter');
const {serializeGameState}=require('./hlm-game-state-serialization');
const {prepareApprovedCPUTradeBatch}=require('./hlm-phase9-cpu-trade-batch-preview');
const {executeReviewedCPUDecisionTrade}=require('./hlm-phase9-cpu-decision-trade-execution-bridge');
function fail(code,message){const e=new Error(message);e.code=code;throw e;}
function createBrowserCPUTradeWorkflow({storage,sourceSlotId,teamId,steps,decisionOptions}={}){
 const repository=createBrowserSaveAdapter(storage);
 if(typeof sourceSlotId!=='string'||!sourceSlotId.trim()||!repository.has(sourceSlotId.trim()))
  fail('CPU_BROWSER_SOURCE_REQUIRED','Existing browser franchise save required');
 const source=repository.load(sourceSlotId.trim()).state;
 if(String(source.meta.controlledTeamId??'')===String(teamId))
  fail('CPU_BROWSER_HUMAN_PROTECTED','Human-controlled franchise cannot be CPU executor');
 const fingerprint=serializeGameState(source);
 const reviewedPreview=prepareApprovedCPUTradeBatch({repository,sourceSlotId:sourceSlotId.trim(),steps,expectedSourceFingerprint:fingerprint});
 return Object.freeze({
  kind:'phase9-browser-cpu-trade-workflow',version:1,sourceSlotId:sourceSlotId.trim(),teamId:String(teamId),
  preview:reviewedPreview,requiresHumanGMApproval:true,autonomousExecutionEnabled:false,
  approveReviewedTrade({preview,confirmApproval=false}={}){
   if(confirmApproval!==true)fail('CPU_BROWSER_REVIEW_APPROVAL_REQUIRED','Human GM must explicitly approve reviewed trade');
   if(preview!==reviewedPreview)fail('CPU_BROWSER_REVIEW_MISMATCH','Human GM must approve the exact workflow preview');
   return Object.freeze({kind:'phase9-browser-cpu-trade-approval',version:1,preview,
    sourceFingerprint:preview.sourceFingerprint,candidateFingerprint:preview.candidateFingerprint,
    transactionIds:Object.freeze([...preview.transactionIds]),humanGMApproved:true});
  },
  execute({destinationSlotId,confirmExecution=false,approval}={}){
   if(confirmExecution!==true)fail('CPU_BROWSER_EXECUTION_APPROVAL_REQUIRED','Human GM must confirm execution');
   if(!approval||approval.kind!=='phase9-browser-cpu-trade-approval'||approval.humanGMApproved!==true||
      approval.preview!==reviewedPreview||approval.sourceFingerprint!==reviewedPreview.sourceFingerprint||
      approval.candidateFingerprint!==reviewedPreview.candidateFingerprint||
      JSON.stringify(approval.transactionIds)!==JSON.stringify(reviewedPreview.transactionIds))
    fail('CPU_BROWSER_EXACT_APPROVAL_REQUIRED','Exact reviewed CPU trade approval required');
   const boundDecision={...decisionOptions,approvedTradeSourceFingerprint:reviewedPreview.sourceFingerprint,
    approvedTradeCandidateFingerprint:reviewedPreview.candidateFingerprint,
    approvedTradeTransactionIds:[...reviewedPreview.transactionIds]};
   return executeReviewedCPUDecisionTrade({repository,sourceSlotId:sourceSlotId.trim(),destinationSlotId,
    teamId,steps,decisionOptions:boundDecision,reviewedPreview,confirmExecution:true});
  }
 });
}
module.exports={createBrowserCPUTradeWorkflow};
