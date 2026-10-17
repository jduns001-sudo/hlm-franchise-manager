'use strict';
const {renderBoundedGMReview,MAX_EVIDENCE_CHARS}=require('./hlm-phase11-gm-review-report-batch-limit');
/** Safe boundary probe. No production save reads or writes. */
function probeGMReviewBoundary(items){
 const result=renderBoundedGMReview(items);
 return Object.freeze({accepted:result.accepted,reason:result.reason||'review-ready',
  evidenceChars:result.evidenceChars,withinLimit:result.evidenceChars<=MAX_EVIDENCE_CHARS,
  hasRenderedPage:!!result.page,requiresGMApproval:true,productionActivationEnabled:false,
  gameplayActionAuthorized:false,saveWriteAllowed:false});
}
module.exports={probeGMReviewBoundary};
