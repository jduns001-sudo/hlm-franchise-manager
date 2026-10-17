'use strict';
/* Read-only simulated evidence review summary. No automatic GM decisions or save writes. */
const {buildEvidenceReview}=require('./hlm-phase11-gm-evidence-review');
function summarizeGMReview(homePeriods,awayPeriods,thresholds=[5,10,25],reviewedThresholds=[]){
 const report=buildEvidenceReview(homePeriods,awayPeriods,thresholds,reviewedThresholds);
 const total=report.entries.length;
 const reviewed=report.entries.filter(e=>e.reviewedByGM).length;
 const withheld=report.entries.filter(e=>e.evidenceStatus==='withheld').length;
 const pending=total-reviewed;
 const entries=report.entries.map(e=>Object.freeze({
  minimumShots:e.minimumShots,
  evidenceStatus:e.evidenceStatus,
  reviewedByGM:e.reviewedByGM,
  direction:e.evidenceStatus==='withheld'?null:e.direction,
  cautionCodes:Object.freeze([...e.cautionCodes]),
  explanation:e.explanation
 }));
 return Object.freeze({
  experimental:true,productionActivationEnabled:false,readOnly:true,
  automaticallyApplied:false,requiresGMApproval:true,
  notPredictive:true,notDecisionAdvice:true,
  totalThresholds:total,reviewedThresholds:reviewed,pendingReviews:pending,
  withheldThresholds:withheld,coverage:report.coverage,
  entries:Object.freeze(entries),
  reviewStatus:pending?'pending':'reviewed',
  interpretation:withheld?'Some historical evidence remains insufficient; review does not resolve evidence gaps':'Review is descriptive only and does not authorize gameplay actions',
  authorizedActions:Object.freeze([])
 });
}
module.exports={summarizeGMReview};
