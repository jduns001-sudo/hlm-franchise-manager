'use strict';
/* Deterministic read-only GM decision audit. Never applies recommendations. */
const {buildPriorityHistory}=require('./hlm-phase11-gm-priority-history');
function buildGMDecisionAudit(state){
 const provenance=buildPriorityHistory(state);
 const entries=provenance.history.map((item,index)=>({
  auditId:'gm-advisory-'+(index+1),priorityId:item.id,
  source:item.source,reason:item.reason,
  evidenceGameIds:item.supportingFinalGames.slice(),
  decision:'pending',requiresGMApproval:true,
  automaticallyApplied:false
 }));
 return {official:false,advisoryOnly:true,productionActivationEnabled:false,controlledTeamId:provenance.controlledTeamId,entries};
}
module.exports={buildGMDecisionAudit};
