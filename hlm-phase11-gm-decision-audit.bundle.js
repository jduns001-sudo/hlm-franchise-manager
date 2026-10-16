/* Experimental GM decision audit browser projection. */
(function(global){'use strict';const module={exports:{}};const require=(path)=>{if(path==='./hlm-phase11-gm-priority-history')return global.HLMPhase11GMPriorityHistory;throw Error('Unsupported module')};
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

global.HLMPhase11GMDecisionAudit=module.exports;
})(typeof window!=='undefined'?window:globalThis);
