/* Experimental GM evidence coverage browser projection. */
(function(global){'use strict';const module={exports:{}};const require=(path)=>{if(path==='./hlm-phase11-gm-evidence-action-queue')return global.HLMPhase11GMEvidenceActionQueue;throw Error('Unsupported module')};
'use strict';
/* Read-only evidence coverage report for the human GM. */
const {buildGMEvidenceActionQueue}=require('./hlm-phase11-gm-evidence-action-queue');
function buildGMEvidenceCoverage(state){
 const actionQueue=buildGMEvidenceActionQueue(state);
 const total=actionQueue.totalActions;
 return {official:false,advisoryOnly:true,productionActivationEnabled:false,
  controlledTeamId:actionQueue.controlledTeamId,requiresGMApproval:true,automaticallyApplied:false,
  totalRecommendations:total,reviewReady:actionQueue.reviewActions,
  awaitingEvidence:actionQueue.evidenceActions,
  coveragePercent:total?Math.round(100*actionQueue.reviewActions/total):0,
  pendingDecisions:actionQueue.queue.filter(item=>item.decision==='pending').length};
}
module.exports={buildGMEvidenceCoverage};

global.HLMPhase11GMEvidenceCoverage=module.exports;
})(typeof window!=='undefined'?window:globalThis);
