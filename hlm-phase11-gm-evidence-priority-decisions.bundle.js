/* Experimental GM evidence priority decisions browser projection. */
(function(global){'use strict';const module={exports:{}};const require=(path)=>{if(path==='./hlm-phase11-gm-evidence-trend-priorities')return global.HLMPhase11GMEvidenceTrendPriorities;throw Error('Unsupported module')};
'use strict';
/* Experimental, non-mutating GM decision preview for evidence-priority review. */
const {buildGMEvidenceTrendPriorities}=require('./hlm-phase11-gm-evidence-trend-priorities');
function previewGMEvidencePriorityDecisions(savedSnapshots){
 const queue=buildGMEvidenceTrendPriorities(savedSnapshots);
 return {official:false,advisoryOnly:true,productionActivationEnabled:false,
  requiresGMApproval:true,automaticallyApplied:false,
  pendingGMReviews:queue.pendingGMReviews,
  decisions:queue.priorities.map((item,index)=>({
   id:'gm-evidence-review-'+(index+1),type:item.type,priority:item.priority,
   proposedAction:'REVIEW_EVIDENCE',status:'PENDING_HUMAN_GM',
   requiresGMApproval:true,automaticallyApplied:false
  }))};
}
module.exports={previewGMEvidencePriorityDecisions};

global.HLMPhase11GMEvidencePriorityDecisions=module.exports;
})(typeof window!=='undefined'?window:globalThis);
