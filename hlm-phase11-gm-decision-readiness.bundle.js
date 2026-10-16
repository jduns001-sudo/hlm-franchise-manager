/* Experimental GM evidence readiness browser projection. */
(function(global){'use strict';const module={exports:{}};const require=(path)=>{if(path==='./hlm-phase11-gm-decision-audit')return global.HLMPhase11GMDecisionAudit;throw Error('Unsupported module')};
'use strict';
/* Experimental human-GM decision readiness. Read-only and no action execution. */
const {buildGMDecisionAudit}=require('./hlm-phase11-gm-decision-audit');
function buildGMDecisionReadiness(state){
 const audit=buildGMDecisionAudit(state);
 const items=audit.entries.map(item=>({
  auditId:item.auditId,priorityId:item.priorityId,
  supportingGames:item.evidenceGameIds.length,
  evidenceAvailable:item.evidenceGameIds.length>0,
  readiness:item.evidenceGameIds.length>0?'review-ready':'needs-evidence',
  requiresGMApproval:true,decision:'pending',automaticallyApplied:false
 }));
 return {official:false,advisoryOnly:true,productionActivationEnabled:false,controlledTeamId:audit.controlledTeamId,items};
}
module.exports={buildGMDecisionReadiness};

global.HLMPhase11GMDecisionReadiness=module.exports;
})(typeof window!=='undefined'?window:globalThis);
