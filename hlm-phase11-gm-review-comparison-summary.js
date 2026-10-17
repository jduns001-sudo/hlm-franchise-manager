'use strict';
/* Transient human-readable summary of validated experimental review changes. */
const {compareGMReviewEvidenceExports}=require('./hlm-phase11-gm-evidence-review-comparison');
function summarizeGMReviewComparison(before,after){
 const comparison=compareGMReviewEvidenceExports(before,after);
 if(!comparison.valid)return Object.freeze({valid:false,errors:comparison.errors,lines:Object.freeze([]),productionActivationEnabled:false,gameplayActionAuthorized:false,saveWriteAllowed:false});
 const lines=comparison.changes.map(change=>{
  const state=v=>v===null?'absent':v?'reviewed':'pending';
  return 'Threshold '+change.threshold+': '+state(change.before)+' → '+state(change.after);
 });
 return Object.freeze({valid:true,changeCount:lines.length,lines:Object.freeze(lines),productionActivationEnabled:false,gameplayActionAuthorized:false,saveWriteAllowed:false,requiresGMApproval:true});
}
module.exports={summarizeGMReviewComparison};
