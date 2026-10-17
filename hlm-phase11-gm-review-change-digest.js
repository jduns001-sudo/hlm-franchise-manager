'use strict';
/* Pure read-only digest of experimental review-state differences. */
const {classifyGMReviewChanges}=require('./hlm-phase11-gm-review-change-severity');
function buildGMReviewChangeDigest(before,after){
 const result=classifyGMReviewChanges(before,after);
 if(!result.valid)return Object.freeze({valid:false,errors:result.errors,counts:null,productionActivationEnabled:false,gameplayActionAuthorized:false,saveWriteAllowed:false});
 const counts={'review-completed':0,'review-reopened':0,'scope-change':0};
 for(const change of result.changes)counts[change.category]++;
 return Object.freeze({valid:true,totalChanges:result.changes.length,counts:Object.freeze(counts),productionActivationEnabled:false,gameplayActionAuthorized:false,saveWriteAllowed:false,requiresGMApproval:true});
}
module.exports={buildGMReviewChangeDigest};
