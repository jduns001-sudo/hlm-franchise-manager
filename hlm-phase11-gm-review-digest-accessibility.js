'use strict';
const {buildGMReviewChangeDigest}=require('./hlm-phase11-gm-review-change-digest');
/** Screen-reader friendly, deterministic text; no production state access. */
function describeGMReviewDigest(before,after){
 const digest=buildGMReviewChangeDigest(before,after);
 const flags={productionActivationEnabled:false,gameplayActionAuthorized:false,saveWriteAllowed:false,requiresGMApproval:true};
 if(!digest.valid)return Object.freeze({...flags,valid:false,text:'Review comparison unavailable: evidence validation failed.'});
 const n=digest.counts;
 const plural=(count,word)=>count+' '+word+(count===1?'':'s');
 const text=digest.totalChanges===0?'No review-state changes.':[
  plural(digest.totalChanges,'review-state change')+'.',
  plural(n['review-completed'],'completed review')+'.',
  plural(n['review-reopened'],'reopened review')+'.',
  plural(n['scope-change'],'scope change')+'.'
 ].join(' ');
 return Object.freeze({...flags,valid:true,text});
}
module.exports={describeGMReviewDigest};
