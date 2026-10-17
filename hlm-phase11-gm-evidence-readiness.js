'use strict';
/* Descriptive historical evidence readiness only, never authorization to act. */
const {summarizeGMReview}=require('./hlm-phase11-gm-review-summary');
function assessGMEvidenceReadiness(homePeriods,awayPeriods,thresholds=[5,10,25],reviewedThresholds=[]){
 const summary=summarizeGMReview(homePeriods,awayPeriods,thresholds,reviewedThresholds);
 const gaps=summary.entries.filter(e=>e.evidenceStatus==='withheld').map(e=>e.minimumShots);
 const unreviewed=summary.entries.filter(e=>!e.reviewedByGM).map(e=>e.minimumShots);
 const flags=Object.freeze([
  ...(gaps.length?['insufficient-historical-evidence']:[]),
  ...(unreviewed.length?['human-review-pending']:[])
 ]);
 return Object.freeze({
  experimental:true,productionActivationEnabled:false,readOnly:true,
  automaticallyApplied:false,requiresGMApproval:true,notPredictive:true,notDecisionAdvice:true,
  evidenceReadyForDescription:gaps.length===0,
  gmReviewComplete:unreviewed.length===0,
  gameplayActionAuthorized:false,
  missingEvidenceThresholds:Object.freeze(gaps),
  pendingReviewThresholds:Object.freeze(unreviewed),
  flags,
  explanation:gaps.length?'Insufficient evidence at one or more thresholds; no directional claim is authorized':'Historical evidence may be described, but is not a prediction or management recommendation',
  note:'Review completion never grants permission for automated trades, roster moves, contracts or save writes'
 });
}
module.exports={assessGMEvidenceReadiness};
