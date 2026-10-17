'use strict';
const {prepareGMReviewRiskBriefIntegrity}=require('./hlm-phase11-gm-review-risk-brief-integrity');
/** Read-only integrity gate: a matching brief digest is never GM approval. */
function checkGMReviewRiskBriefChange(items,digest,acknowledged,acknowledgedAtMs,checkTimes,maxAgeMs=86400000,previousSha256=null){
 const evidence=prepareGMReviewRiskBriefIntegrity(items,digest,acknowledged,acknowledgedAtMs,checkTimes,maxAgeMs,previousSha256);
 const status=evidence.matchesExpected===true?'unchanged':evidence.matchesExpected===false?'changed':'unverified';
 return Object.freeze({status,currentSha256:evidence.sha256,reviewRequired:evidence.reviewRequired,
  requiresFreshGMReview:status!=='unchanged'||evidence.reviewRequired,
  requiresGMApproval:true,productionActivationEnabled:false,gameplayActionAuthorized:false,saveWriteAllowed:false});
}
module.exports={checkGMReviewRiskBriefChange};
