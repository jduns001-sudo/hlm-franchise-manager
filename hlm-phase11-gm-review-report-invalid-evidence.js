'use strict';
const {buildSecureGMReviewPage}=require('./hlm-phase11-gm-review-report-security');
/** Fail-closed wrapper that explicitly denies presenting malformed review batches. */
function validateAndRenderGMReview(items){
 const validShape=Array.isArray(items)&&items.length>0&&items.length<=50&&items.every(item=>item&&typeof item.before==='string'&&typeof item.after==='string');
 if(!validShape)return Object.freeze({accepted:false,reason:'invalid-batch-shape',page:null,requiresGMApproval:true,productionActivationEnabled:false,gameplayActionAuthorized:false,saveWriteAllowed:false});
 const page=buildSecureGMReviewPage(items);
 const invalid=page.html.includes('GM review batch unavailable: invalid evidence or batch.');
 return Object.freeze({accepted:!invalid,reason:invalid?'invalid-evidence':'review-ready',page:invalid?null:page,requiresGMApproval:true,productionActivationEnabled:false,gameplayActionAuthorized:false,saveWriteAllowed:false});
}
module.exports={validateAndRenderGMReview};
