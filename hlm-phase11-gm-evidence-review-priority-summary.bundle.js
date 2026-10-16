/* Experimental GM evidence review priority summary browser projection. */
(function(global){'use strict';const module={exports:{}};const require=(path)=>{if(path==='./hlm-phase11-gm-evidence-review-summary')return global.HLMPhase11GMEvidenceReviewSummary;throw Error('Unsupported module')};
'use strict';
/* Read-only priority grouping for pending human GM evidence reviews. */
const {buildGMEvidenceReviewSummary}=require('./hlm-phase11-gm-evidence-review-summary');
function buildGMEvidenceReviewPrioritySummary(savedSnapshots){
 const report=buildGMEvidenceReviewSummary(savedSnapshots);
 const groups=Object.create(null);
 for(const review of report.reviews){
  const priority=String(review.priority??'UNSPECIFIED');
  if(!groups[priority])groups[priority]={priority,pendingGMReviews:0,incompleteReviewSteps:0};
  groups[priority].pendingGMReviews++;
  groups[priority].incompleteReviewSteps+=review.remainingSteps.length;
 }
 return {official:false,advisoryOnly:true,productionActivationEnabled:false,
  requiresGMApproval:true,automaticallyApplied:false,
  pendingGMReviews:report.pendingGMReviews,
  incompleteReviewSteps:report.incompleteReviewSteps,
  priorityGroups:Object.values(groups).sort((a,b)=>a.priority.localeCompare(b.priority))};
}
module.exports={buildGMEvidenceReviewPrioritySummary};

global.HLMPhase11GMEvidenceReviewPrioritySummary=module.exports;
})(typeof window!=='undefined'?window:globalThis);
