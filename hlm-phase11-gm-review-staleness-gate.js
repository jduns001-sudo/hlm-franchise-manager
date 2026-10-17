'use strict';
const {summarizeGMReviewChange}=require('./hlm-phase11-gm-review-change-summary');
/** Experimental review gate. A matching digest never grants gameplay authorization. */
function checkGMReviewStaleness(items,previousSha256){
 const summary=summarizeGMReviewChange(items,previousSha256);
 const current=summary.status==='unchanged';
 return Object.freeze({status:summary.status,reviewCurrent:current,requiresFreshGMReview:!current,
  message:current?'Evidence unchanged; human GM approval still required':
   summary.status==='changed'?'Evidence changed; new human GM review required':'Evidence unavailable; human GM review required',
  requiresGMApproval:true,productionActivationEnabled:false,gameplayActionAuthorized:false,saveWriteAllowed:false});
}
module.exports={checkGMReviewStaleness};
