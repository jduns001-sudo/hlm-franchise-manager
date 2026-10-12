'use strict';
// Mission 530: present a compact, safe, read-only summary of a reviewed batch audit.
const {verifyGameBatchAuditReviewReceipt}=require('./hlm-phase9-batch-audit-review-receipt-verification');
function summarizeGameBatchAuditReview({storage,json,receipt}={}){
 const verification=verifyGameBatchAuditReviewReceipt({storage,json,receipt});
 if(!verification.valid)return Object.freeze({
  kind:'phase9-game-batch-audit-review-summary',version:1,
  status:'REJECTED',verified:false,errors:verification.errors,
  gameCount:0,persistencePerformed:false,activeFranchiseSlotReplaced:false
 });
 const payload=JSON.parse(json);
 const embedded=JSON.parse(payload.files['audit.json']);
 const audit=embedded.receipt;
 return Object.freeze({
  kind:'phase9-game-batch-audit-review-summary',version:1,
  status:'VERIFIED',verified:true,reviewerId:receipt.reviewerId,
  gameCount:verification.gameCount,
  sourceSlotId:receipt.sourceSlotId,destinationSlotId:receipt.destinationSlotId,
  jsonFingerprint:receipt.jsonFingerprint,
  csvFingerprint:receipt.csvFingerprint,
  textFingerprint:receipt.textFingerprint,
  approvalConfirmed:receipt.reviewConfirmed===true,
  batchApprovalRecorded:!!audit.confirmSimulation,
  errors:Object.freeze([]),persistencePerformed:false,activeFranchiseSlotReplaced:false
 });
}
module.exports={summarizeGameBatchAuditReview};
