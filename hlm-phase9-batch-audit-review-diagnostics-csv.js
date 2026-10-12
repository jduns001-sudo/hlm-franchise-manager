'use strict';
// Mission 539: spreadsheet-safe, read-only diagnostics for GM review packages.
const {diagnoseGameBatchAuditReviewPackage}=require('./hlm-phase9-batch-audit-review-diagnostics');
function csvCell(value){
 let s=String(value==null?'':value).replace(/[\r\n\t\x00-\x1f\x7f]/g,' ').slice(0,1024);
 if(/^\s*[=+\-@]/.test(s))s="'"+s;
 return '"'+s.replace(/"/g,'""')+'"';
}
function exportGameBatchAuditReviewDiagnosticsCsv({storage,json,originalAuditJson,receipt}={}){
 const result=diagnoseGameBatchAuditReviewPackage({storage,json,originalAuditJson,receipt});
 const rows=[['status','valid','issue_number','code','message']];
 if(result.issues.length===0)rows.push([result.status,result.valid,'','','']);
 else result.issues.forEach((issue,index)=>rows.push([result.status,result.valid,index+1,issue.code,issue.message]));
 return Object.freeze({kind:'phase9-game-batch-audit-review-diagnostics-csv',version:1,
  valid:result.valid,rowCount:rows.length-1,csv:rows.map(row=>row.map(csvCell).join(',')).join('\r\n')+'\r\n',
  persistencePerformed:false,activeFranchiseSlotReplaced:false});
}
module.exports={exportGameBatchAuditReviewDiagnosticsCsv};
