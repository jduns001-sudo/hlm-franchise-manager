'use strict';
// Mission 529: validate a reviewer receipt against an audit package and current saves.
const {verifyGameBatchAuditPackageAgainstSaves}=require('./hlm-phase9-batch-audit-package-save-verification');
function verifyGameBatchAuditReviewReceipt({storage,json,receipt}={}){
 const errors=[];
 const verification=verifyGameBatchAuditPackageAgainstSaves({storage,json});
 if(!verification.valid)errors.push(...verification.errors);
 if(!receipt||receipt.kind!=='phase9-game-batch-audit-review-receipt'||receipt.version!==1||
 receipt.reviewConfirmed!==true||receipt.verified!==true||
 typeof receipt.reviewerId!=='string'||!receipt.reviewerId.trim())
 errors.push('GAME_BATCH_REVIEW_RECEIPT_INVALID');
 else if(verification.valid){
  const payload=JSON.parse(json),manifest=payload.manifest;
  if(receipt.gameCount!==verification.gameCount)errors.push('GAME_BATCH_REVIEW_RECEIPT_COUNT_MISMATCH');
  if(receipt.sourceSlotId!==verification.sourceSlotId||
    receipt.destinationSlotId!==verification.destinationSlotId)
    errors.push('GAME_BATCH_REVIEW_RECEIPT_SLOT_MISMATCH');
  for(const key of ['jsonFingerprint','csvFingerprint','textFingerprint'])
   if(receipt[key]!==manifest[key])
    errors.push('GAME_BATCH_REVIEW_RECEIPT_'+key.toUpperCase()+'_MISMATCH');
 }
 return Object.freeze({
  kind:'phase9-game-batch-audit-review-receipt-verification',version:1,
  valid:errors.length===0,errors:Object.freeze(errors),
  gameCount:verification.gameCount||0,
  persistencePerformed:false,activeFranchiseSlotReplaced:false
 });
}
module.exports={verifyGameBatchAuditReviewReceipt};
