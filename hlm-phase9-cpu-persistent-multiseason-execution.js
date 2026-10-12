'use strict';
// Explicitly approved multi-season execution into a separate verified save.
// No automatic calendar, game, or CPU transaction execution occurs.
const {serializeGameState}=require('./hlm-game-state-serialization');
const {previewCPUMultiSeasonSave,commitPreviewedCPUMultiSeasonSave}=require('./hlm-phase9-cpu-multiseason-preview-commit');
function fail(code,message){const e=new Error(message);e.code=code;throw e;}
function executeReviewedCPUMultiSeason({repository,reviewedPreview,transitions,destinationSlotId,confirmExecution=false}={}){
 if(confirmExecution!==true)fail('CPU_MULTI_SEASON_EXECUTION_APPROVAL_REQUIRED','Human GM must approve multi-season execution');
 if(!reviewedPreview||reviewedPreview.kind!=='phase9-cpu-multiseason-save-preview'||reviewedPreview.readyForExplicitCommit!==true)
  fail('CPU_MULTI_SEASON_EXECUTION_REVIEW_REQUIRED','Reviewed multi-season preview required');
 const fresh=previewCPUMultiSeasonSave({repository,sourceSlotId:reviewedPreview.sourceSlotId,transitions});
 if(fresh.sourceFingerprint!==reviewedPreview.sourceFingerprint||
    fresh.candidateFingerprint!==reviewedPreview.candidateFingerprint||
    JSON.stringify(fresh.transitions)!==JSON.stringify(reviewedPreview.transitions))
  fail('CPU_MULTI_SEASON_EXECUTION_STALE','Approved multi-season plan changed');
 const commit=commitPreviewedCPUMultiSeasonSave({repository,preview:reviewedPreview,transitions,destinationSlotId,confirmCommit:true});
 if(serializeGameState(repository.load(commit.destinationSlotId).state)!==reviewedPreview.candidateFingerprint)
  fail('CPU_MULTI_SEASON_EXECUTION_VERIFY_FAILED','Persisted multi-season state differs from approval');
 return Object.freeze({kind:'phase9-approved-cpu-multiseason-persistent-execution',version:1,
  sourceSlotId:commit.sourceSlotId,destinationSlotId:commit.destinationSlotId,
  transitionCount:commit.transitionCount,executed:true,persisted:true,verified:true,
  sourcePreserved:true,activeFranchiseSlotReplaced:false,autonomousExecutionEnabled:false,
  gamesSimulated:false,calendarAutomaticallyAdvanced:false,requiresHumanGMApproval:true});
}
module.exports={executeReviewedCPUMultiSeason};
