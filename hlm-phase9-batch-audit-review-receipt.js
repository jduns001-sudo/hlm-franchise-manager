'use strict';
// Mission 528: generate an immutable read-only receipt for explicitly reviewed audit packages.
const {reviewGameBatchAuditPackage}=require('./hlm-phase9-batch-audit-review-gate');
const {inspectGameBatchAuditPackage}=require('./hlm-phase9-batch-audit-package');
function createGameBatchAuditReviewReceipt({storage,json,confirmReview=false,reviewerId}={}){
 const review=reviewGameBatchAuditPackage({storage,json,confirmReview});
 if(!review.accepted)throw Object.assign(new Error('Audit package review not accepted'),{
  code:'GAME_BATCH_AUDIT_REVIEW_NOT_ACCEPTED',errors:review.errors});
 if(typeof reviewerId!=='string'||!reviewerId.trim())
  throw Object.assign(new Error('Reviewer ID required'),{code:'GAME_BATCH_AUDIT_REVIEWER_REQUIRED'});
 const inspected=inspectGameBatchAuditPackage(json);
 if(!inspected.valid)throw new Error('Audit package integrity changed during review');
 const payload=JSON.parse(json);
 const manifest=payload.manifest;
 return Object.freeze({
  kind:'phase9-game-batch-audit-review-receipt',version:1,
  reviewerId:reviewerId.trim(),reviewConfirmed:true,verified:true,
  gameCount:review.gameCount,sourceSlotId:review.sourceSlotId,
  destinationSlotId:review.destinationSlotId,
  jsonFingerprint:manifest.jsonFingerprint,
  csvFingerprint:manifest.csvFingerprint,
  textFingerprint:manifest.textFingerprint,
  persistencePerformed:false,activeFranchiseSlotReplaced:false
 });
}
module.exports={createGameBatchAuditReviewReceipt};
