'use strict';
const {assessGMReviewRiskBriefReadiness}=require('./hlm-phase11-gm-review-risk-brief-readiness');
/** Present a bounded, read-only human decision brief without authorizing an action. */
function buildGMReviewReadinessDecisionBrief(items,digest,acknowledged,acknowledgedAtMs,checkTimes,maxAgeMs=86400000,previousSha256=null){
 const assessment=assessGMReviewRiskBriefReadiness(items,digest,acknowledged,acknowledgedAtMs,checkTimes,maxAgeMs,previousSha256);
 const headline=assessment.readyForHumanReview?'Evidence ready for human GM inspection':'GM review blocked until evidence is refreshed';
 const lines=Object.freeze([headline,...assessment.reasons.map(reason=>'Reason: '+reason),
  'The human GM must decide; no gameplay action is authorized.']);
 return Object.freeze({status:assessment.status,headline,lines,readyForHumanReview:assessment.readyForHumanReview,
  requiresGMApproval:true,productionActivationEnabled:false,gameplayActionAuthorized:false,saveWriteAllowed:false});
}
module.exports={buildGMReviewReadinessDecisionBrief};
