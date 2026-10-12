'use strict';
const {serializeGameState}=require('./hlm-game-state-serialization');
const {createSequentialCPUSeasonTransitionCandidates}=require('./hlm-phase9-cpu-multiseason-chain');
const {persistApprovedCPUMultiSeasonCandidate}=require('./hlm-phase9-cpu-multiseason-save');
function fail(code,message){const e=new Error(message);e.code=code;throw e;}
function previewCPUMultiSeasonSave({repository,sourceSlotId,transitions}={}){
 if(!repository||typeof repository.has!=='function'||typeof repository.load!=='function')
  fail('CPU_MULTI_SEASON_PREVIEW_REPOSITORY','Save repository required');
 if(typeof sourceSlotId!=='string'||!sourceSlotId.trim()||!repository.has(sourceSlotId.trim()))
  fail('CPU_MULTI_SEASON_PREVIEW_SOURCE','Existing source slot required');
 const id=sourceSlotId.trim();
 const source=repository.load(id).state;
 const sourceFingerprint=serializeGameState(source);
 const candidate=createSequentialCPUSeasonTransitionCandidates(source,transitions);
 if(serializeGameState(repository.load(id).state)!==sourceFingerprint)
  fail('CPU_MULTI_SEASON_PREVIEW_SOURCE_CHANGED','Source save changed during preview');
 return Object.freeze({kind:'phase9-cpu-multiseason-save-preview',version:1,sourceSlotId:id,
  sourceFingerprint,candidateFingerprint:candidate.candidateFingerprint,
  transitionCount:candidate.transitions.length,transitions:candidate.transitions,
  candidateOnly:true,readyForExplicitCommit:true,productionCPUExecutionEnabled:false});
}
function commitPreviewedCPUMultiSeasonSave({repository,preview,transitions,destinationSlotId,confirmCommit=false}={}){
 if(!preview||preview.kind!=='phase9-cpu-multiseason-save-preview'||preview.readyForExplicitCommit!==true)
  fail('CPU_MULTI_SEASON_PREVIEW_INVALID','Verified preview required');
 if(confirmCommit!==true)fail('CPU_MULTI_SEASON_PREVIEW_APPROVAL_REQUIRED','Explicit confirmation required');
 const fresh=previewCPUMultiSeasonSave({repository,sourceSlotId:preview.sourceSlotId,transitions});
 if(fresh.sourceFingerprint!==preview.sourceFingerprint||
    fresh.candidateFingerprint!==preview.candidateFingerprint||
    fresh.transitionCount!==preview.transitionCount||
    JSON.stringify(fresh.transitions)!==JSON.stringify(preview.transitions))
  fail('CPU_MULTI_SEASON_PREVIEW_STALE','Transition no longer matches approved preview');
 const result=persistApprovedCPUMultiSeasonCandidate({repository,sourceSlotId:preview.sourceSlotId,
  destinationSlotId,expectedSourceFingerprint:preview.sourceFingerprint,transitions,confirmCommit:true});
 if(serializeGameState(repository.load(result.destinationSlotId).state)!==preview.candidateFingerprint)
  fail('CPU_MULTI_SEASON_PREVIEW_VERIFY_FAILED','Saved state differs from approved preview');
 return Object.freeze({kind:'phase9-previewed-cpu-multiseason-committed',version:1,
  sourceSlotId:result.sourceSlotId,destinationSlotId:result.destinationSlotId,
  transitionCount:result.transitionCount,verified:true,previewMatched:true,
  sourcePreserved:true,activeFranchiseSlotReplaced:false,productionCPUExecutionEnabled:false});
}
module.exports={previewCPUMultiSeasonSave,commitPreviewedCPUMultiSeasonSave};
