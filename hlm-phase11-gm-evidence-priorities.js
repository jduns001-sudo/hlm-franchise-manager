'use strict';
/* Experimental review ordering only. No production save access or automated GM actions. */
const {buildGMEvidenceBrief}=require('./hlm-phase11-gm-evidence-brief');
function prioritizeGMEvidence(homePeriods,awayPeriods,thresholds=[5,10,25]){
 const brief=buildGMEvidenceBrief(homePeriods,awayPeriods,thresholds);
 const priorities=brief.entries.map(e=>Object.freeze({
  minimumShots:e.threshold,
  status:e.evidenceStatus,
  reviewPriority:e.evidenceStatus==='withheld'?'evidence-gap':'manual-review',
  direction:e.evidenceStatus==='withheld'?null:e.direction,
  cautionCodes:Object.freeze([...e.cautions]),
  nextStep:e.evidenceStatus==='withheld'?'Collect more comparable historical observations':'Inspect historical observations; GM decides whether action is appropriate'
 })).sort((a,b)=>(a.reviewPriority==='evidence-gap'?0:1)-(b.reviewPriority==='evidence-gap'?0:1)||a.minimumShots-b.minimumShots);
 return Object.freeze({
  experimental:true,productionActivationEnabled:false,readOnly:true,
  automaticallyApplied:false,requiresGMApproval:true,notPredictive:true,notDecisionAdvice:true,
  coverage:brief.coverage,priorities:Object.freeze(priorities),
  summary:priorities.some(p=>p.status==='withheld')?'Evidence gaps require review before drawing conclusions':'Historical evidence available for manual review only',
  prohibitedActions:Object.freeze(['save-write','trade','contract','lineup-change','roster-move'])
 });
}
module.exports={prioritizeGMEvidence};
