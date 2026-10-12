'use strict';
// Mission 544: browser-ready files for the verified GM diagnostics package.
// The caller controls downloads. This function never mutates a franchise save.
const {packageGameBatchAuditReviewDiagnostics,inspectGameBatchAuditReviewDiagnosticsPackage}=require('./hlm-phase9-batch-audit-review-diagnostics-package');
function prepareGameBatchAuditReviewDiagnosticsDownloads(args={}){
 const packaged=packageGameBatchAuditReviewDiagnostics(args);
 const check=inspectGameBatchAuditReviewDiagnosticsPackage(packaged.json);
 if(!check.valid)throw Object.assign(new Error('Diagnostics package integrity check failed'),{code:'DIAGNOSTICS_DOWNLOAD_INTEGRITY_FAILURE'});
 const payload=JSON.parse(packaged.json);
 const files=Object.freeze([
  Object.freeze({filename:'gm-review-diagnostics.json',mimeType:'application/json;charset=utf-8',content:payload.files['diagnostics.json']}),
  Object.freeze({filename:'gm-review-diagnostics.csv',mimeType:'text/csv;charset=utf-8',content:payload.files['diagnostics.csv']}),
  Object.freeze({filename:'gm-review-diagnostics.txt',mimeType:'text/plain;charset=utf-8',content:payload.files['diagnostics.txt']}),
  Object.freeze({filename:'gm-review-diagnostics-package.json',mimeType:'application/json;charset=utf-8',content:packaged.json})
 ]);
 return Object.freeze({kind:'phase9-game-batch-audit-review-diagnostics-downloads',version:1,
  valid:packaged.valid,files,persistencePerformed:false,activeFranchiseSlotReplaced:false});
}
module.exports={prepareGameBatchAuditReviewDiagnosticsDownloads};
