'use strict';
/* Experimental evidence may inform human review, never grant gameplay permissions. */
const {assessGMEvidenceReadiness}=require('./hlm-phase11-gm-evidence-readiness');
const DENIED=Object.freeze(['trade','contract','lineup-change','roster-move','save-write','waiver','draft-pick']);
function evaluateGMEvidenceActionBoundary(homePeriods,awayPeriods,thresholds=[5,10,25],reviewedThresholds=[]){
 const readiness=assessGMEvidenceReadiness(homePeriods,awayPeriods,thresholds,reviewedThresholds);
 const blockers=Object.freeze([
  'production-activation-disabled',
  'human-gm-approval-required',
  ...(readiness.missingEvidenceThresholds.length?['historical-evidence-incomplete']:[]),
  ...(readiness.pendingReviewThresholds.length?['review-incomplete']:[])
 ]);
 return Object.freeze({
  experimental:true,productionActivationEnabled:false,readOnly:true,
  automaticallyApplied:false,requiresGMApproval:true,notPredictive:true,notDecisionAdvice:true,
  evidenceReadyForDescription:readiness.evidenceReadyForDescription,
  gmReviewComplete:readiness.gmReviewComplete,
  gameplayActionAuthorized:false,
  deniedAutomaticActions:DENIED,
  blockers,
  explanation:'Evidence review never constitutes consent or permission to execute franchise transactions',
  nextStep:'Human GM may inspect the evidence separately; gameplay decisions require existing explicit production controls'
 });
}
module.exports={evaluateGMEvidenceActionBoundary};
