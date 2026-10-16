'use strict';
/* Read-only GM decision review checklist. Never approves, executes, or saves decisions. */
const {explainGMEvidencePriorityDecisions}=require('./hlm-phase11-gm-evidence-decision-explanations');
function buildGMEvidenceDecisionReview(savedSnapshots){
 const explanations=explainGMEvidencePriorityDecisions(savedSnapshots);
 return {official:false,advisoryOnly:true,productionActivationEnabled:false,
  requiresGMApproval:true,automaticallyApplied:false,
  reviews:explanations.decisions.map(item=>({
   id:item.id,priority:item.priority,explanation:item.explanation,
   status:'PENDING_HUMAN_GM',checklist:['Inspect evidence','Evaluate franchise impact','Make GM decision'],
   humanDecisionRecorded:false,requiresGMApproval:true,automaticallyApplied:false
  }))};
}
module.exports={buildGMEvidenceDecisionReview};
