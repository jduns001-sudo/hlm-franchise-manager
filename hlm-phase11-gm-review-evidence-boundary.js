'use strict';
const {checkGMReviewDigestConsistency}=require('./hlm-phase11-gm-review-digest-consistency');
/* Fail-closed read-only approval boundary for experimental evidence comparisons. */
function assessGMReviewEvidenceBoundary(before,after){
 const check=checkGMReviewDigestConsistency(before,after);
 const reason=!check.valid?'invalid-evidence':!check.consistent?'inconsistent-evidence':check.totalChanges===0?'no-change':'human-review-required';
 return Object.freeze({valid:check.valid,consistent:check.consistent,reason,
  canPresentToGM:check.valid&&check.consistent,
  requiresGMApproval:true,productionActivationEnabled:false,
  gameplayActionAuthorized:false,saveWriteAllowed:false,
  totalChanges:check.valid&&check.consistent?check.totalChanges:null});
}
module.exports={assessGMReviewEvidenceBoundary};
