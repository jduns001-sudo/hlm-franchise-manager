'use strict';
const {describeGMReviewBatch}=require('./hlm-phase11-gm-review-batch-details');
/* Immutable, deterministic GM-facing report. Never authorizes a gameplay action. */
function buildGMReviewBatchReport(items){
 const batch=describeGMReviewBatch(items);
 const lines=!batch.valid?['GM review batch unavailable: invalid evidence or batch.']:[
  'GM review batch: '+batch.details.length+' comparison'+(batch.details.length===1?'':'s')+'.',
  batch.reviewCount+' require'+(batch.reviewCount===1?'s':'')+' human GM review.',
  batch.unchangedCount+' unchanged.',
  batch.totalChanges+' total review-state change'+(batch.totalChanges===1?'':'s')+'.',
  ...batch.details.map(item=>'Comparison '+(item.index+1)+': '+(item.reason==='no-change'?'unchanged':item.totalChanges+' review-state changes; human GM review required')+'.')
 ];
 return Object.freeze({valid:batch.valid,canPresentToGM:batch.canPresentToGM,
  lines:Object.freeze(lines),requiresGMApproval:true,productionActivationEnabled:false,
  gameplayActionAuthorized:false,saveWriteAllowed:false});
}
module.exports={buildGMReviewBatchReport};
