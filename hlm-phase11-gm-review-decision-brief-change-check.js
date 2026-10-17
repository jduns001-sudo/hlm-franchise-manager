'use strict';
const {timingSafeEqual}=require('node:crypto');
const {prepareGMReviewDecisionBriefIntegrity}=require('./hlm-phase11-gm-review-decision-brief-integrity');
/** Compare human-facing GM decision brief fingerprint; never authorize gameplay. */
function checkGMReviewDecisionBriefChange(items,digest,acknowledged,acknowledgedAtMs,checkTimes,maxAgeMs=86400000,priorRiskBriefSha256=null,previousDecisionBriefSha256=null){
 const current=prepareGMReviewDecisionBriefIntegrity(items,digest,acknowledged,acknowledgedAtMs,checkTimes,maxAgeMs,priorRiskBriefSha256);
 const valid=typeof previousDecisionBriefSha256==='string'&&/^[a-f0-9]{64}$/.test(previousDecisionBriefSha256);
 const unchanged=valid&&timingSafeEqual(Buffer.from(current.sha256,'hex'),Buffer.from(previousDecisionBriefSha256,'hex'));
 const status=!valid?'unverified':unchanged?'unchanged':'changed';
 return Object.freeze({status,currentSha256:current.sha256,readyForHumanReview:current.readyForHumanReview,
  requiresFreshGMReview:status!=='unchanged'||!current.readyForHumanReview,
  requiresGMApproval:true,productionActivationEnabled:false,gameplayActionAuthorized:false,saveWriteAllowed:false});
}
module.exports={checkGMReviewDecisionBriefChange};
