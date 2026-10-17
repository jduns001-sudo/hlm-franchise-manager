'use strict';
const {buildGMReviewTransitionTimeline}=require('./hlm-phase11-gm-review-transition-timeline');
/** Aggregated read-only timeline diagnostics; no GM action authorization. */
function summarizeGMReviewTransitions(items,digest,acknowledged,acknowledgedAtMs,checkTimes,maxAgeMs=86400000){
 const timeline=buildGMReviewTransitionTimeline(items,digest,acknowledged,acknowledgedAtMs,checkTimes,maxAgeMs);
 if(timeline.status==='unavailable')return Object.freeze({status:'unavailable',reason:timeline.reason,checkCount:0,transitionCount:0,firstFailureIndex:null,counts:Object.freeze({}),requiresFreshAcknowledgement:true,requiresGMApproval:true,productionActivationEnabled:false,gameplayActionAuthorized:false,saveWriteAllowed:false});
 const counts={};let firstFailureIndex=null;
 timeline.transitions.forEach((entry,index)=>{counts[entry.transition]=(counts[entry.transition]||0)+1;if(firstFailureIndex===null&&entry.requiresFreshAcknowledgement)firstFailureIndex=index+1;});
 return Object.freeze({status:timeline.status,checkCount:checkTimes.length,transitionCount:timeline.transitions.length,firstFailureIndex,counts:Object.freeze(counts),
  requiresFreshAcknowledgement:timeline.requiresFreshAcknowledgement,requiresGMApproval:true,productionActivationEnabled:false,gameplayActionAuthorized:false,saveWriteAllowed:false});
}
module.exports={summarizeGMReviewTransitions};
