'use strict';
// Mission 527: explicit read-only review gate for portable game batch audit packages.
const {verifyGameBatchAuditPackageAgainstSaves}=require('./hlm-phase9-batch-audit-package-save-verification');
function reviewGameBatchAuditPackage({storage,json,confirmReview=false}={}){
 const verification=verifyGameBatchAuditPackageAgainstSaves({storage,json});
 const errors=[...verification.errors];
 if(confirmReview!==true)errors.push('GAME_BATCH_AUDIT_REVIEW_CONFIRMATION_REQUIRED');
 const accepted=errors.length===0;
 return Object.freeze({
  kind:'phase9-game-batch-audit-review-gate',version:1,
  accepted,verified:verification.valid,reviewConfirmed:confirmReview===true,
  errors:Object.freeze(errors),gameCount:verification.gameCount||0,
  sourceSlotId:verification.sourceSlotId||null,
  destinationSlotId:verification.destinationSlotId||null,
  persistencePerformed:false,activeFranchiseSlotReplaced:false
 });
}
module.exports={reviewGameBatchAuditPackage};
