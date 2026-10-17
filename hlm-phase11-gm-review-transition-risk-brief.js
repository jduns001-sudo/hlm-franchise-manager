'use strict';
const {summarizeGMReviewTransitions}=require('./hlm-phase11-gm-review-transition-summary');
/** Deterministic read-only GM risk brief from bounded acknowledgement checks. */
function buildGMReviewTransitionRiskBrief(items,digest,acknowledged,acknowledgedAtMs,checkTimes,maxAgeMs=86400000){
 const summary=summarizeGMReviewTransitions(items,digest,acknowledged,acknowledgedAtMs,checkTimes,maxAgeMs);
 const reviewRequired=summary.status!=='current';
 const headline=summary.status==='unavailable'?'Review timeline unavailable':
  reviewRequired?'Fresh GM evidence acknowledgement required':'Evidence acknowledgement remains current; GM approval still required';
 const lines=Object.freeze([headline,
  summary.status==='unavailable'?'Check sequence invalid':'Checks: '+summary.checkCount+'; transitions: '+summary.transitionCount,
  summary.firstFailureIndex===null?'No failed checkpoint':'First failed checkpoint: '+summary.firstFailureIndex,
  'No gameplay action authorized']);
 return Object.freeze({status:summary.status,headline,lines,reviewRequired,
  requiresGMApproval:true,productionActivationEnabled:false,gameplayActionAuthorized:false,saveWriteAllowed:false});
}
module.exports={buildGMReviewTransitionRiskBrief};
