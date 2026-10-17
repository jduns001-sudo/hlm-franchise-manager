'use strict';
const {auditGMReviewDecisionBrief}=require('./hlm-phase11-gm-review-decision-brief-audit');
/** Bounded, deterministic, read-only audit export for offline human inspection. */
function exportGMReviewDecisionAudit(items,digest,acknowledged,acknowledgedAtMs,checkTimes,maxAgeMs=86400000,priorRiskBriefSha256=null,previousDecisionBriefSha256=null,checkedAtMs=null){
 const audit=auditGMReviewDecisionBrief(items,digest,acknowledged,acknowledgedAtMs,checkTimes,maxAgeMs,priorRiskBriefSha256,previousDecisionBriefSha256,checkedAtMs);
 const record=Object.freeze({schemaVersion:1,status:audit.status,checkedAtMs:audit.checkedAtMs,sha256:audit.sha256,
  requiresFreshGMReview:audit.requiresFreshGMReview,requiresGMApproval:true,productionActivationEnabled:false,gameplayActionAuthorized:false,saveWriteAllowed:false});
 const text=JSON.stringify(record);
 return Object.freeze({status:audit.status,text,record,requiresGMApproval:true,
  productionActivationEnabled:false,gameplayActionAuthorized:false,saveWriteAllowed:false});
}
module.exports={exportGMReviewDecisionAudit};
