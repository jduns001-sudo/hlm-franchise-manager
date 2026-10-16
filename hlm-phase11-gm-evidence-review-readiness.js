'use strict';
/* Experimental, deterministic and non-mutating GM evidence review readiness. */
const {buildGMEvidenceDecisionReview}=require('./hlm-phase11-gm-evidence-decision-review');
function buildGMEvidenceReviewReadiness(savedSnapshots){
 const report=buildGMEvidenceDecisionReview(savedSnapshots);
 return {official:false,advisoryOnly:true,productionActivationEnabled:false,
  requiresGMApproval:true,automaticallyApplied:false,
  pendingGMReviews:report.reviews.length,
  reviews:report.reviews.map(item=>({
   id:item.id,priority:item.priority,explanation:item.explanation,
   status:'PENDING_HUMAN_GM',reviewSteps:item.checklist.map(label=>({label,completed:false})),
   readyForAutomaticExecution:false,humanDecisionRecorded:false
  }))};
}
module.exports={buildGMEvidenceReviewReadiness};
