'use strict';
const {auditGMReviewRecheckTransition}=require('./hlm-phase11-gm-review-recheck-transition-audit');
const MAX_CHECKS=32;
/** Read-only deterministic timeline of GM evidence acknowledgement checks. */
function buildGMReviewTransitionTimeline(items,digest,acknowledged,acknowledgedAtMs,checkTimes,maxAgeMs=86400000){
 if(!Array.isArray(checkTimes)||checkTimes.length<2||checkTimes.length>MAX_CHECKS||checkTimes.some(t=>!Number.isSafeInteger(t)||t<0))
  return unavailable('invalid-check-times');
 const ordered=checkTimes.every((t,i)=>i===0||t>=checkTimes[i-1]);
 if(!ordered)return unavailable('invalid-check-order');
 const entries=[];
 for(let i=1;i<checkTimes.length;i++){
  const a=auditGMReviewRecheckTransition(items,digest,acknowledged,acknowledgedAtMs,checkTimes[i-1],checkTimes[i],maxAgeMs);
  entries.push(Object.freeze({fromMs:checkTimes[i-1],toMs:checkTimes[i],transition:a.transition,status:a.status,requiresFreshAcknowledgement:a.requiresFreshAcknowledgement}));
 }
 const transitions=Object.freeze(entries);
 return Object.freeze({status:transitions.every(e=>e.status==='current')?'current':'review-required',transitions,
  requiresFreshAcknowledgement:transitions.some(e=>e.requiresFreshAcknowledgement),
  requiresGMApproval:true,productionActivationEnabled:false,gameplayActionAuthorized:false,saveWriteAllowed:false});
}
function unavailable(reason){return Object.freeze({status:'unavailable',reason,transitions:Object.freeze([]),requiresFreshAcknowledgement:true,
 requiresGMApproval:true,productionActivationEnabled:false,gameplayActionAuthorized:false,saveWriteAllowed:false});}
module.exports={buildGMReviewTransitionTimeline,MAX_CHECKS};
