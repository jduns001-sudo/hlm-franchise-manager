'use strict';
/* Transient explanation of review-change counts; no simulation or save effects. */
const {buildGMReviewChangeDigest}=require('./hlm-phase11-gm-review-change-digest');
function narrateGMReviewChangeDigest(before,after){
 const digest=buildGMReviewChangeDigest(before,after);
 if(!digest.valid)return Object.freeze({valid:false,errors:digest.errors,lines:Object.freeze([]),productionActivationEnabled:false,gameplayActionAuthorized:false,saveWriteAllowed:false});
 const lines=digest.totalChanges===0?['No review-state differences found.']:[
  digest.totalChanges+' review-state differences found.',
  digest.counts['review-completed']+' reviews completed.',
  digest.counts['review-reopened']+' reviews reopened.',
  digest.counts['scope-change']+' review scope changes.'
 ];
 return Object.freeze({valid:true,lines:Object.freeze(lines),productionActivationEnabled:false,gameplayActionAuthorized:false,saveWriteAllowed:false,requiresGMApproval:true});
}
module.exports={narrateGMReviewChangeDigest};
