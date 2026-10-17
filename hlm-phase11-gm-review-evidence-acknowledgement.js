'use strict';
const {checkGMReviewStaleness}=require('./hlm-phase11-gm-review-staleness-gate');
/** Explicit read-only acknowledgement of current evidence, never gameplay approval. */
function acknowledgeGMReviewEvidence(items,expectedSha256,acknowledged){
 const freshness=checkGMReviewStaleness(items,expectedSha256);
 const eligible=freshness.reviewCurrent&&acknowledged===true;
 return Object.freeze({status:eligible?'acknowledged':freshness.status==='unchanged'?'awaiting-human-acknowledgement':'blocked',
 acknowledged:eligible,requiresFreshGMReview:freshness.requiresFreshGMReview,
 requiresGMApproval:true,productionActivationEnabled:false,gameplayActionAuthorized:false,saveWriteAllowed:false});
}
module.exports={acknowledgeGMReviewEvidence};
