'use strict';
// Mission 515: require a matching read-only preview before committing an isolated game batch.
const {previewGameBatch}=require('./hlm-phase9-game-batch-preview');
const {persistReviewedGameBatch}=require('./hlm-phase9-isolated-game-batch');
function fail(code,message){throw Object.assign(new Error(message),{code});}
function persistPreviewApprovedGameBatch({preview,confirmSimulation=false,...args}={}){
 if(confirmSimulation!==true)fail('GAME_BATCH_APPROVAL_REQUIRED','Explicit GM approval required');
 if(!preview||preview.kind!=='phase9-game-batch-preview'||preview.persistencePerformed!==false||
    preview.approvalGranted!==false||typeof preview.sourceFingerprint!=='string'||
    typeof preview.candidateFingerprint!=='string'||!Array.isArray(preview.results))
  fail('GAME_BATCH_PREVIEW_REQUIRED','Valid read-only preview required');
 const current=previewGameBatch(args);
 if(current.sourceSlotId!==preview.sourceSlotId||
    current.sourceFingerprint!==preview.sourceFingerprint||
    current.candidateFingerprint!==preview.candidateFingerprint||
    JSON.stringify(current.results)!==JSON.stringify(preview.results))
  fail('GAME_BATCH_PREVIEW_STALE','Preview does not match current source and game inputs');
 const result=persistReviewedGameBatch({...args,confirmSimulation:true});
 if(result.candidateFingerprint!==preview.candidateFingerprint)
  fail('GAME_BATCH_APPROVED_RESULT_MISMATCH','Approved result differs from preview');
 return Object.freeze({...result,previewMatched:true,gmApproved:true});
}
module.exports={persistPreviewApprovedGameBatch};
