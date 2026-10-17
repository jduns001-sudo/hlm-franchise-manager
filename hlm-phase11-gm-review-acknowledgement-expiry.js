'use strict';
const {acknowledgeGMReviewEvidence}=require('./hlm-phase11-gm-review-evidence-acknowledgement');
/** Explicit evidence acknowledgement expires deterministically; never approves gameplay. */
function checkGMReviewAcknowledgementExpiry(items,expectedSha256,acknowledged,acknowledgedAtMs,nowMs,maxAgeMs=86400000){
 const validClock=Number.isSafeInteger(nowMs)&&nowMs>=0&&Number.isSafeInteger(acknowledgedAtMs)&&acknowledgedAtMs>=0;
 const validAge=Number.isSafeInteger(maxAgeMs)&&maxAgeMs>0&&maxAgeMs<=604800000;
 const review=acknowledgeGMReviewEvidence(items,expectedSha256,acknowledged);
 const eligible=review.acknowledged===true&&validClock&&validAge&&nowMs>=acknowledgedAtMs&&nowMs-acknowledgedAtMs<=maxAgeMs;
 const status=!review.acknowledged?'blocked':!validClock||!validAge?'invalid-clock':nowMs<acknowledgedAtMs?'future-acknowledgement':eligible?'current':'expired';
 return Object.freeze({status,acknowledgementCurrent:eligible,requiresFreshAcknowledgement:!eligible,requiresGMApproval:true,productionActivationEnabled:false,gameplayActionAuthorized:false,saveWriteAllowed:false});
}
module.exports={checkGMReviewAcknowledgementExpiry};
