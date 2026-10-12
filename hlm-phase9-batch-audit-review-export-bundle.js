'use strict';
// Mission 533: combine verified GM review formats into a single read-only export bundle.
const {summarizeGameBatchAuditReview}=require('./hlm-phase9-batch-audit-review-summary');
const {formatGameBatchAuditReviewSummary}=require('./hlm-phase9-batch-audit-review-summary-text');
const {exportGameBatchAuditReviewCsv}=require('./hlm-phase9-batch-audit-review-summary-csv');
function bundleGameBatchAuditReview({storage,json,receipt}={}){
 const args={storage,json,receipt};
 const summary=summarizeGameBatchAuditReview(args);
 const text=formatGameBatchAuditReviewSummary(args);
 const csv=exportGameBatchAuditReviewCsv(args);
 if(summary.verified!==text.verified||summary.verified!==csv.verified)
  throw Object.assign(new Error('Review export verification mismatch'),{code:'GAME_BATCH_REVIEW_BUNDLE_MISMATCH'});
 const jsonText=JSON.stringify(summary,null,2)+'\n';
 return Object.freeze({
  kind:'phase9-game-batch-audit-review-export-bundle',version:1,
  verified:summary.verified,
  json:jsonText,csv:csv.csv,text:text.text,
  formats:Object.freeze(['json','csv','text']),
  persistencePerformed:false,activeFranchiseSlotReplaced:false
 });
}
module.exports={bundleGameBatchAuditReview};
