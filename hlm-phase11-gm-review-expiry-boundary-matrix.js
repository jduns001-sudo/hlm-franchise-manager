'use strict';
const {checkGMReviewAcknowledgementExpiry}=require('./hlm-phase11-gm-review-acknowledgement-expiry');
const MAX_AGE_MS=604800000;
/** Read-only deterministic matrix for timestamp-boundary review diagnostics. */
function evaluateGMReviewExpiryBoundaries(items,digest,acknowledged,acknowledgedAtMs,nowMs,maxAgeMs=86400000){
 const review=checkGMReviewAcknowledgementExpiry(items,digest,acknowledged,acknowledgedAtMs,nowMs,maxAgeMs);
 const validClock=Number.isSafeInteger(acknowledgedAtMs)&&acknowledgedAtMs>=0&&Number.isSafeInteger(nowMs)&&nowMs>=0;
 const validAge=Number.isSafeInteger(maxAgeMs)&&maxAgeMs>0&&maxAgeMs<=MAX_AGE_MS;
 const elapsedMs=validClock&&nowMs>=acknowledgedAtMs?nowMs-acknowledgedAtMs:null;
 const remainingMs=validAge&&elapsedMs!==null&&elapsedMs<=maxAgeMs?maxAgeMs-elapsedMs:null;
 return Object.freeze({status:review.status,acknowledgementCurrent:review.acknowledgementCurrent,
  elapsedMs,remainingMs,atExpiryBoundary:review.acknowledgementCurrent&&remainingMs===0,
  requiresFreshAcknowledgement:review.requiresFreshAcknowledgement,
  requiresGMApproval:true,productionActivationEnabled:false,gameplayActionAuthorized:false,saveWriteAllowed:false});
}
module.exports={evaluateGMReviewExpiryBoundaries,MAX_AGE_MS};
