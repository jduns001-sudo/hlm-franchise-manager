'use strict';
/* Sanitized, transient evidence-review summary, not a production save export. */
const {buildGMEvidenceDecisionAudit}=require('./hlm-phase11-gm-evidence-decision-audit');
function exportGMReviewEvidence(homePeriods,awayPeriods,thresholds=[5,10,25],reviewedThresholds=[]){
 const audit=buildGMEvidenceDecisionAudit(homePeriods,awayPeriods,thresholds,reviewedThresholds);
 const rows=audit.records.map(record=>Object.freeze({
  threshold:record.threshold,
  reviewed:record.reviewedByGM,
  actionAuthorized:false
 }));
 const payload=Object.freeze({
  schemaVersion:1,
  kind:'experimental-gm-review-evidence',
  productionActivationEnabled:false,
  persistent:false,
  gameplayActionAuthorized:false,
  requiresGMApproval:true,
  rows:Object.freeze(rows)
 });
 return Object.freeze({payload,text:JSON.stringify(payload,null,2)});
}
module.exports={exportGMReviewEvidence};
