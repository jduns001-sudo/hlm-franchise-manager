'use strict';
const {createHash,timingSafeEqual}=require('node:crypto');
const {buildGMReviewReadinessDecisionBrief}=require('./hlm-phase11-gm-review-readiness-decision-brief');
/** Fingerprint a computed human-facing GM review brief, never an authorization. */
function prepareGMReviewDecisionBriefIntegrity(items,digest,acknowledged,acknowledgedAtMs,checkTimes,maxAgeMs=86400000,expectedSha256=null){
 const brief=buildGMReviewReadinessDecisionBrief(items,digest,acknowledged,acknowledgedAtMs,checkTimes,maxAgeMs,expectedSha256);
 const canonical=JSON.stringify({status:brief.status,headline:brief.headline,lines:brief.lines,readyForHumanReview:brief.readyForHumanReview});
 const sha256=createHash('sha256').update(canonical,'utf8').digest('hex');
 return Object.freeze({status:brief.status,sha256,readyForHumanReview:brief.readyForHumanReview,
  requiresGMApproval:true,productionActivationEnabled:false,gameplayActionAuthorized:false,saveWriteAllowed:false});
}
module.exports={prepareGMReviewDecisionBriefIntegrity};
