'use strict';
const {createCPUDecisionCycleRecommendations}=require('./hlm-cpu-decision-cycle-recommendations');
function createCPUDecisionCycleReviewQueue(state,teamId,options={}){
 const recommendationsPackage=createCPUDecisionCycleRecommendations(state,teamId,options);
 const recommendation=recommendationsPackage.recommendation;
 const item=Object.freeze({
  id:'cpu-review:'+String(recommendationsPackage.teamId)+':'+String(recommendationsPackage.diagnosticsPackage.auditPackage.summaryPackage.summary.priorityId||'unselected'),
  teamId:recommendationsPackage.teamId,
  status:recommendation.status,
  nextStep:recommendation.nextStep,
  reason:recommendation.reason,
  humanReviewRequired:true,
  executionEnabled:false
 });
 return Object.freeze({
  kind:'cpu-decision-cycle-review-queue',version:1,teamId:recommendationsPackage.teamId,
  recommendationsPackage,items:Object.freeze([item]),
  queue:Object.freeze({count:1,pendingCount:1,advisoryOnly:true,executedCount:0}),
  authority:recommendationsPackage.authority,sourceStateMutated:false,persistencePerformed:false
 });
}
module.exports={createCPUDecisionCycleReviewQueue};
