'use strict';
/* Read-only experimental GM evidence summary. No decisions are executed. */
const {buildGMDecisionReadiness}=require('./hlm-phase11-gm-decision-readiness');
function buildGMEvidenceSummary(state){
 const readiness=buildGMDecisionReadiness(state);
 const reviewReady=readiness.items.filter(item=>item.readiness==='review-ready').length;
 const needsEvidence=readiness.items.length-reviewReady;
 return {official:false,advisoryOnly:true,productionActivationEnabled:false,
  controlledTeamId:readiness.controlledTeamId,totalRecommendations:readiness.items.length,
  reviewReady,needsEvidence,requiresGMApproval:true,automaticallyApplied:false,
  items:readiness.items.map(item=>({auditId:item.auditId,readiness:item.readiness,decision:'pending'}))};
}
module.exports={buildGMEvidenceSummary};
