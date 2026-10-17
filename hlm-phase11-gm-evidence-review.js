'use strict';
/* Explicit, read-only GM review annotations for simulated evidence. */
const {prioritizeGMEvidence}=require('./hlm-phase11-gm-evidence-priorities');
function buildEvidenceReview(homePeriods,awayPeriods,thresholds=[5,10,25],reviewedThresholds=[]){
 const queue=prioritizeGMEvidence(homePeriods,awayPeriods,thresholds);
 const reviewed=new Set(reviewedThresholds.filter(Number.isFinite));
 const entries=queue.priorities.map(item=>Object.freeze({
  minimumShots:item.minimumShots,
  evidenceStatus:item.status,
  reviewPriority:item.reviewPriority,
  reviewedByGM:reviewed.has(item.minimumShots),
  direction:item.status==='withheld'?null:item.direction,
  cautionCodes:Object.freeze([...item.cautionCodes]),
  explanation:item.status==='withheld'
   ?'This threshold lacks sufficient comparable historical evidence; direction is withheld'
   :'Historical simulated observations are available; they cannot predict future outcomes',
  nextStep:item.nextStep
 }));
 return Object.freeze({
  experimental:true,productionActivationEnabled:false,readOnly:true,
  automaticallyApplied:false,requiresGMApproval:true,
  notPredictive:true,notDecisionAdvice:true,
  coverage:queue.coverage,entries:Object.freeze(entries),
  pendingReviews:entries.filter(e=>!e.reviewedByGM).length,
  note:'Review annotations are transient inputs only; no production save or management action is performed'
 });
}
module.exports={buildEvidenceReview};
