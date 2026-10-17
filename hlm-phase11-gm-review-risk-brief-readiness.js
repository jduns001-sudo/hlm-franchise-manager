'use strict';
const {checkGMReviewRiskBriefChange}=require('./hlm-phase11-gm-review-risk-brief-change-gate');
/** Human-review readiness only. Never authorizes gameplay or production save changes. */
function assessGMReviewRiskBriefReadiness(items,digest,acknowledged,acknowledgedAtMs,checkTimes,maxAgeMs=86400000,previousSha256=null){
 const gate=checkGMReviewRiskBriefChange(items,digest,acknowledged,acknowledgedAtMs,checkTimes,maxAgeMs,previousSha256);
 const readyForHumanReview=gate.status==='unchanged'&&!gate.reviewRequired;
 const reasons=Object.freeze([...(gate.status!=='unchanged'?['brief-integrity-unverified-or-changed']:[]),...(gate.reviewRequired?['fresh-evidence-acknowledgement-required']:[])]);
 return Object.freeze({status:readyForHumanReview?'ready-for-human-review':'blocked',readyForHumanReview,reasons,
  currentSha256:gate.currentSha256,requiresGMApproval:true,productionActivationEnabled:false,gameplayActionAuthorized:false,saveWriteAllowed:false});
}
module.exports={assessGMReviewRiskBriefReadiness};
