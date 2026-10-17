'use strict';
/* Descriptive review-change categories only, never gameplay urgency or authority. */
const {compareGMReviewEvidenceExports}=require('./hlm-phase11-gm-evidence-review-comparison');
function classifyGMReviewChanges(before,after){
 const comparison=compareGMReviewEvidenceExports(before,after);
 if(!comparison.valid)return Object.freeze({valid:false,errors:comparison.errors,changes:Object.freeze([]),productionActivationEnabled:false,gameplayActionAuthorized:false,saveWriteAllowed:false});
 const changes=comparison.changes.map(c=>Object.freeze({
  threshold:c.threshold,
  category:c.before===null||c.after===null?'scope-change':c.after?'review-completed':'review-reopened',
  actionAuthorized:false
 }));
 return Object.freeze({valid:true,changes:Object.freeze(changes),productionActivationEnabled:false,gameplayActionAuthorized:false,saveWriteAllowed:false,requiresGMApproval:true});
}
module.exports={classifyGMReviewChanges};
