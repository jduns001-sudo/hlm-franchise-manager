'use strict';
/* Experimental, deterministic, read-only GM evidence action queue. */
const {buildGMEvidenceSummary}=require('./hlm-phase11-gm-evidence-summary');
function buildGMEvidenceActionQueue(state){
 const summary=buildGMEvidenceSummary(state);
 const queue=summary.items.map(item=>({
  auditId:item.auditId,
  readiness:item.readiness,
  nextAction:item.readiness==='review-ready'?'GM_REVIEW':'GATHER_EVIDENCE',
  decision:'pending',requiresGMApproval:true,automaticallyApplied:false
 })).sort((a,b)=>(a.nextAction==='GM_REVIEW'?0:1)-(b.nextAction==='GM_REVIEW'?0:1)||String(a.auditId).localeCompare(String(b.auditId)));
 return {official:false,advisoryOnly:true,productionActivationEnabled:false,
  controlledTeamId:summary.controlledTeamId,requiresGMApproval:true,automaticallyApplied:false,
  totalActions:queue.length,reviewActions:queue.filter(x=>x.nextAction==='GM_REVIEW').length,
  evidenceActions:queue.filter(x=>x.nextAction==='GATHER_EVIDENCE').length,queue};
}
module.exports={buildGMEvidenceActionQueue};
