'use strict';
const {validateGMReviewDecisionAuditImport}=require('./hlm-phase11-gm-review-decision-audit-import-validation');
/** Check freshness of an imported audit without treating its timestamp as proof of approval. */
function assessGMReviewAuditFreshness(text,nowMs,maxAgeMs=86400000){
 const imported=validateGMReviewDecisionAuditImport(text);
 const clockValid=Number.isSafeInteger(nowMs)&&nowMs>=0;
 const ageValid=Number.isSafeInteger(maxAgeMs)&&maxAgeMs>0&&maxAgeMs<=604800000;
 const time=imported.valid?imported.record.checkedAtMs:null;
 const timestampValid=Number.isSafeInteger(time)&&time>=0;
 let status='invalid-audit';
 if(imported.valid){
  if(!clockValid||!ageValid||!timestampValid)status='invalid-clock';
  else if(time>nowMs)status='future-audit';
  else if(nowMs-time>maxAgeMs)status='expired';
  else if(imported.record.status!=='unchanged'||imported.record.requiresFreshGMReview)status='review-required';
  else status='current-read-only';
 }
 return Object.freeze({status,auditCurrent:status==='current-read-only',
  requiresFreshGMReview:status!=='current-read-only',checkedAtMs:timestampValid?time:null,
  requiresGMApproval:true,productionActivationEnabled:false,gameplayActionAuthorized:false,saveWriteAllowed:false});
}
module.exports={assessGMReviewAuditFreshness};
