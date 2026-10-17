'use strict';
const {assessGMReviewEvidenceBoundary}=require('./hlm-phase11-gm-review-evidence-boundary');
/** Validate a bounded set of experimental GM evidence comparisons, without side effects. */
function assessGMReviewBatch(items){
 const safe=Array.isArray(items)&&items.length>0&&items.length<=50&&items.every(item=>
  item&&typeof item==='object'&&!Array.isArray(item)&&typeof item.before==='string'&&typeof item.after==='string');
 const decisions=safe?items.map(item=>assessGMReviewEvidenceBoundary(item.before,item.after)):[];
 const valid=safe&&decisions.every(item=>item.valid&&item.consistent);
 const reviewCount=valid?decisions.filter(item=>item.reason==='human-review-required').length:0;
 const unchangedCount=valid?decisions.filter(item=>item.reason==='no-change').length:0;
 const totalChanges=valid?decisions.reduce((sum,item)=>sum+item.totalChanges,0):null;
 return Object.freeze({
  valid:!!valid,canPresentToGM:!!valid,
  reason:!safe?'invalid-batch':!valid?'invalid-evidence':reviewCount?'human-review-required':'no-change',
  itemCount:safe?items.length:0,reviewCount,unchangedCount,totalChanges,
  requiresGMApproval:true,productionActivationEnabled:false,gameplayActionAuthorized:false,saveWriteAllowed:false
 });
}
module.exports={assessGMReviewBatch};
