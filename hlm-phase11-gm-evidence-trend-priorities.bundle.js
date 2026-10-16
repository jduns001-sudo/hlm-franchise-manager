/* Experimental GM evidence trend priorities browser projection. */
(function(global){'use strict';const module={exports:{}};const require=(path)=>{if(path==='./hlm-phase11-gm-evidence-trend-alerts')return global.HLMPhase11GMEvidenceTrendAlerts;throw Error('Unsupported module')};
'use strict';
/* Advisory-only prioritized review queue derived from saved franchise evidence alerts. */
const {buildGMEvidenceTrendAlerts}=require('./hlm-phase11-gm-evidence-trend-alerts');
function buildGMEvidenceTrendPriorities(savedSnapshots){
 const report=buildGMEvidenceTrendAlerts(savedSnapshots);
 const priorityByType={COVERAGE_DECLINE:1,EVIDENCE_GAPS:2};
 const priorities=report.alerts.map(alert=>({
  ...alert,priority:priorityByType[alert.type]??99,
  action:'REVIEW_EVIDENCE',requiresGMApproval:true,automaticallyApplied:false
 })).sort((a,b)=>a.priority-b.priority||a.type.localeCompare(b.type));
 return {official:false,advisoryOnly:true,productionActivationEnabled:false,
  requiresGMApproval:true,automaticallyApplied:false,priorities,
  pendingGMReviews:priorities.length};
}
module.exports={buildGMEvidenceTrendPriorities};

global.HLMPhase11GMEvidenceTrendPriorities=module.exports;
})(typeof window!=='undefined'?window:globalThis);
