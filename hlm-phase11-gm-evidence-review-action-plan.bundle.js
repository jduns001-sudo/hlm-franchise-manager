/* Experimental GM evidence review action plan browser projection. */
(function(global){'use strict';const module={exports:{}};const require=(path)=>{if(path==='./hlm-phase11-gm-evidence-review-summary')return global.HLMPhase11GMEvidenceReviewSummary;throw Error('Unsupported module')};
'use strict';
/* Deterministic advisory GM evidence action plan. Never executes or saves. */
const {buildGMEvidenceReviewSummary}=require('./hlm-phase11-gm-evidence-review-summary');
function buildGMEvidenceReviewActionPlan(savedSnapshots){
 const report=buildGMEvidenceReviewSummary(savedSnapshots);
 return {official:false,advisoryOnly:true,productionActivationEnabled:false,
  requiresGMApproval:true,automaticallyApplied:false,
  pendingGMReviews:report.pendingGMReviews,
  actions:report.reviews.map(review=>({
   id:review.id,priority:review.priority,status:'PENDING_HUMAN_GM',
   explanation:review.explanation,
   nextReviewStep:review.remainingSteps[0]??null,
   remainingReviewSteps:review.remainingSteps.slice(),
   requiresGMApproval:true,humanDecisionRecorded:false,automaticallyApplied:false
  }))};
}
module.exports={buildGMEvidenceReviewActionPlan};

global.HLMPhase11GMEvidenceReviewActionPlan=module.exports;
})(typeof window!=='undefined'?window:globalThis);
