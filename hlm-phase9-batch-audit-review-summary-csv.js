'use strict';
// Mission 532: spreadsheet-compatible read-only export of reviewed game batch audits.
const {summarizeGameBatchAuditReview}=require('./hlm-phase9-batch-audit-review-summary');
function csvCell(value){
 let s=String(value==null?'':value).replace(/[\r\n\t\x00-\x1f\x7f]/g,' ').slice(0,1024);
 if(/^[\s]*[=+\-@]/.test(s))s="'"+s;
 return '"'+s.replace(/"/g,'""')+'"';
}
function exportGameBatchAuditReviewCsv({storage,json,receipt}={}){
 const summary=summarizeGameBatchAuditReview({storage,json,receipt});
 const keys=['status','verified','reviewerId','gameCount','sourceSlotId','destinationSlotId','approvalConfirmed','jsonFingerprint','csvFingerprint','textFingerprint','errors'];
 const values=keys.map(k=>k==='errors'?summary.errors.join('; '):summary[k]);
 const csv=keys.map(csvCell).join(',')+'\r\n'+values.map(csvCell).join(',')+'\r\n';
 return Object.freeze({kind:'phase9-game-batch-audit-review-summary-csv',version:1,
  csv,verified:summary.verified,rowCount:1,
  persistencePerformed:false,activeFranchiseSlotReplaced:false});
}
module.exports={exportGameBatchAuditReviewCsv};
