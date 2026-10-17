'use strict';
const {createHash,timingSafeEqual}=require('node:crypto');
const {buildGMReviewTransitionRiskBrief}=require('./hlm-phase11-gm-review-transition-risk-brief');
/** Hashes a computed, read-only GM risk brief to detect changes before human review. */
function prepareGMReviewRiskBriefIntegrity(items,digest,acknowledged,acknowledgedAtMs,checkTimes,maxAgeMs=86400000,expectedSha256=null){
 const brief=buildGMReviewTransitionRiskBrief(items,digest,acknowledged,acknowledgedAtMs,checkTimes,maxAgeMs);
 const canonical=JSON.stringify({status:brief.status,headline:brief.headline,lines:brief.lines,reviewRequired:brief.reviewRequired});
 const sha256=createHash('sha256').update(canonical,'utf8').digest('hex');
 const validExpected=typeof expectedSha256==='string'&&/^[a-f0-9]{64}$/.test(expectedSha256);
 const matchesExpected=validExpected?timingSafeEqual(Buffer.from(sha256,'hex'),Buffer.from(expectedSha256,'hex')):null;
 return Object.freeze({status:brief.status,sha256,matchesExpected,reviewRequired:brief.reviewRequired,
  requiresGMApproval:true,productionActivationEnabled:false,gameplayActionAuthorized:false,saveWriteAllowed:false});
}
module.exports={prepareGMReviewRiskBriefIntegrity};
