'use strict';
/* Experimental descriptive GM evidence briefing. Never writes saves or makes decisions. */
const {reportEvidenceCoverage}=require('./hlm-phase11-evidence-coverage');
function buildGMEvidenceBrief(homePeriods,awayPeriods,thresholds=[5,10,25]){
 const report=reportEvidenceCoverage(homePeriods,awayPeriods,thresholds);
 const entries=report.items.map(item=>Object.freeze({
  threshold:item.minimumShots,
  evidenceStatus:item.status,
  observation:item.status==='supported'
   ?'Simulated historical comparison available; review underlying periods before acting'
   :'Insufficient comparable simulated evidence; no conclusion supported',
  direction:item.status==='supported'?item.direction:null,
  cautions:Object.freeze([...item.cautions]),
  action:'Review evidence manually'
 }));
 const withheld=entries.filter(x=>x.evidenceStatus==='withheld').length;
 return Object.freeze({
  experimental:true,productionActivationEnabled:false,readOnly:true,
  automaticallyApplied:false,requiresGMApproval:true,notPredictive:true,
  notDecisionAdvice:true,coverage:report.coverage,
  coverageFraction:report.coverageFraction,
  headline:withheld?'Evidence is incomplete; GM review required':'Evidence coverage complete; GM review still required',
  cautionCodes:Object.freeze([...report.cautionCodes]),
  entries:Object.freeze(entries),
  interpretation:report.interpretation,
  recommendation:'No automatic roster, trade, contract, lineup, or save action is authorized'
 });
}
module.exports={buildGMEvidenceBrief};
