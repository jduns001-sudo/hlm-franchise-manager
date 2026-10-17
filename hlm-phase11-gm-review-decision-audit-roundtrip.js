'use strict';
const {exportGMReviewDecisionAudit}=require('./hlm-phase11-gm-review-decision-audit-export');
const {validateGMReviewDecisionAuditImport}=require('./hlm-phase11-gm-review-decision-audit-import-validation');
/** Round-trip an audit export and validate it without touching production state. */
function verifyGMReviewDecisionAuditRoundtrip(items,digest,acknowledged,acknowledgedAtMs,checkTimes,maxAgeMs=86400000,priorRiskBriefSha256=null,previousDecisionBriefSha256=null,checkedAtMs=null){
 const exported=exportGMReviewDecisionAudit(items,digest,acknowledged,acknowledgedAtMs,checkTimes,maxAgeMs,priorRiskBriefSha256,previousDecisionBriefSha256,checkedAtMs);
 const imported=validateGMReviewDecisionAuditImport(exported.text);
 const matches=imported.valid&&JSON.stringify(imported.record)===exported.text;
 return Object.freeze({status:matches?'verified-read-only':'blocked',valid:matches,
  auditStatus:matches?imported.record.status:null,
  sha256:matches?imported.record.sha256:null,
  requiresFreshGMReview:!matches||imported.record.requiresFreshGMReview,
  requiresGMApproval:true,productionActivationEnabled:false,gameplayActionAuthorized:false,saveWriteAllowed:false});
}
module.exports={verifyGMReviewDecisionAuditRoundtrip};
