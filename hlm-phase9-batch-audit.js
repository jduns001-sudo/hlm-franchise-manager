'use strict';
// Mission 516: derive an immutable audit receipt for an approved isolated game batch.
const {persistPreviewApprovedGameBatch}=require('./hlm-phase9-preview-approved-batch');
function fail(code,message){throw Object.assign(new Error(message),{code});}
function persistAuditedGameBatch(args={}){
 const result=persistPreviewApprovedGameBatch(args);
 if(result.verified!==true||result.previewMatched!==true||result.gmApproved!==true)
  fail('GAME_BATCH_AUDIT_UNVERIFIED','Verified GM-approved batch required');
 const receipt=Object.freeze({
  kind:'phase9-approved-game-batch-audit',version:1,
  sourceSlotId:result.sourceSlotId,destinationSlotId:result.destinationSlotId,
  sourceFingerprint:result.sourceFingerprint,candidateFingerprint:result.candidateFingerprint,
  games:Object.freeze(result.results.map((r,index)=>Object.freeze({
   order:index+1,gameId:r.gameId,seed:r.seed,
   score:Object.freeze({homeGoals:r.score.homeGoals,awayGoals:r.score.awayGoals})
  }))),
  gmApproved:true,previewMatched:true,sourcePreserved:true,
  persistenceVerified:true,activeFranchiseSlotReplaced:false
 });
 return Object.freeze({result,receipt});
}
module.exports={persistAuditedGameBatch};
