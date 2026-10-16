/* Experimental GM evidence decision explanations browser projection. */
(function(global){'use strict';const module={exports:{}};const require=(path)=>{if(path==='./hlm-phase11-gm-evidence-priority-decisions')return global.HLMPhase11GMEvidencePriorityDecisions;throw Error('Unsupported module')};
'use strict';
/* Deterministic explanations for pending, non-mutating GM evidence decisions. */
const {previewGMEvidencePriorityDecisions}=require('./hlm-phase11-gm-evidence-priority-decisions');
const REASONS={COVERAGE_DECLINE:'Evidence coverage declined across the supplied snapshots.',EVIDENCE_GAPS:'The latest snapshot contains unresolved evidence gaps.'};
function explainGMEvidencePriorityDecisions(savedSnapshots){
 const preview=previewGMEvidencePriorityDecisions(savedSnapshots);
 return {official:false,advisoryOnly:true,productionActivationEnabled:false,
  requiresGMApproval:true,automaticallyApplied:false,
  decisions:preview.decisions.map(item=>({...item,explanation:REASONS[item.type]||'Evidence review recommended.',
   approvalRequiredBeforeAnyAction:true}))};
}
module.exports={explainGMEvidencePriorityDecisions};

global.HLMPhase11GMEvidenceDecisionExplanations=module.exports;
})(typeof window!=='undefined'?window:globalThis);
