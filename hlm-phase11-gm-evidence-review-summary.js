'use strict';
/* Deterministic, read-only GM evidence review summary. No production writes. */
const {buildGMEvidenceReviewReadiness}=require('./hlm-phase11-gm-evidence-review-readiness');
function buildGMEvidenceReviewSummary(savedSnapshots){
 const readiness=buildGMEvidenceReviewReadiness(savedSnapshots);
 return {official:false,advisoryOnly:true,productionActivationEnabled:false,
  requiresGMApproval:true,automaticallyApplied:false,
  pendingGMReviews:readiness.pendingGMReviews,
  incompleteReviewSteps:readiness.reviews.reduce((total,review)=>total+review.reviewSteps.filter(step=>!step.completed).length,0),
  reviews:readiness.reviews.map(review=>({
   id:review.id,priority:review.priority,status:'PENDING_HUMAN_GM',
   explanation:review.explanation,remainingSteps:review.reviewSteps.map(step=>step.label),
   humanDecisionRecorded:false,automaticallyApplied:false
  }))};
}
module.exports={buildGMEvidenceReviewSummary};
