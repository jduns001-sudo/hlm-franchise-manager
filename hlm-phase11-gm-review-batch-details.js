'use strict';
const {assessGMReviewBatch}=require('./hlm-phase11-gm-review-batch-boundary');
const {assessGMReviewEvidenceBoundary}=require('./hlm-phase11-gm-review-evidence-boundary');
/* Read-only, bounded per-item details. Reject whole batch if any item is invalid. */
function describeGMReviewBatch(items){
 const summary=assessGMReviewBatch(items);
 const details=summary.valid?items.map((item,index)=>{
  const result=assessGMReviewEvidenceBoundary(item.before,item.after);
  return Object.freeze({index,reason:result.reason,totalChanges:result.totalChanges,requiresGMApproval:true});
 }):[];
 return Object.freeze({
  valid:summary.valid,canPresentToGM:summary.canPresentToGM,
  reason:summary.reason,reviewCount:summary.reviewCount,
  unchangedCount:summary.unchangedCount,totalChanges:summary.totalChanges,
  details:Object.freeze(details),requiresGMApproval:true,
  productionActivationEnabled:false,gameplayActionAuthorized:false,saveWriteAllowed:false
 });
}
module.exports={describeGMReviewBatch};
