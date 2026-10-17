'use strict';
const {renderBoundedGMReview}=require('./hlm-phase11-gm-review-report-batch-limit');
/** Presentation-only wrapper. Never returns actionable GM commands or save mutations. */
function presentGMReviewSafely(items){
 const result=renderBoundedGMReview(items);
 if(!result.accepted||!result.page)return Object.freeze({status:'unavailable',html:null,reason:result.reason||'invalid-evidence',requiresGMApproval:true,productionActivationEnabled:false,gameplayActionAuthorized:false,saveWriteAllowed:false});
 return Object.freeze({status:'read-only',html:result.page.html,reason:'human-review-required',requiresGMApproval:true,productionActivationEnabled:false,gameplayActionAuthorized:false,saveWriteAllowed:false});
}
module.exports={presentGMReviewSafely};
