'use strict';
const {checkGMReviewDecisionBriefChange}=require('./hlm-phase11-gm-review-decision-brief-change-check');
/** Deterministic read-only audit record of a human GM decision brief check. */
function auditGMReviewDecisionBrief(items,digest,acknowledged,acknowledgedAtMs,checkTimes,maxAgeMs=86400000,priorRiskBriefSha256=null,previousDecisionBriefSha256=null,checkedAtMs=null){
 const check=checkGMReviewDecisionBriefChange(items,digest,acknowledged,acknowledgedAtMs,checkTimes,maxAgeMs,priorRiskBriefSha256,previousDecisionBriefSha256);
 const validTime=Number.isSafeInteger(checkedAtMs)&&checkedAtMs>=0;
 const status=validTime?check.status:'invalid-audit-time';
 const lines=Object.freeze(['Decision brief status: '+status,
  'Fresh GM review: '+(check.requiresFreshGMReview?'required':'not required by this check'),
  'Human GM approval still required; no gameplay action authorized']);
 return Object.freeze({status,checkedAtMs:validTime?checkedAtMs:null,sha256:check.currentSha256,
  lines,requiresFreshGMReview:!validTime||check.requiresFreshGMReview,
  requiresGMApproval:true,productionActivationEnabled:false,gameplayActionAuthorized:false,saveWriteAllowed:false});
}
module.exports={auditGMReviewDecisionBrief};
