'use strict';
/* Transient review audit, not an authorization log or persistent save. */
const {evaluateGMEvidenceActionBoundary}=require('./hlm-phase11-gm-evidence-action-boundary');
function buildGMEvidenceDecisionAudit(homePeriods,awayPeriods,thresholds=[5,10,25],reviewedThresholds=[]){
 const boundary=evaluateGMEvidenceActionBoundary(homePeriods,awayPeriods,thresholds,reviewedThresholds);
 const records=thresholds.map((threshold,i)=>Object.freeze({
  order:i,threshold,
  reviewedByGM:reviewedThresholds.includes(threshold),
  evidenceIncomplete:boundary.blockers.includes('historical-evidence-incomplete'),
  actionAuthorized:false,
  eventType:'experimental-evidence-review'
 }));
 return Object.freeze({
  experimental:true,productionActivationEnabled:false,readOnly:true,
  persistent:false,automaticallyApplied:false,requiresGMApproval:true,
  gameplayActionAuthorized:false,records:Object.freeze(records),
  blockers:boundary.blockers,
  note:'This transient audit records only simulated review state. It does not authorize or execute transactions.'
 });
}
module.exports={buildGMEvidenceDecisionAudit};
