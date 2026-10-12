'use strict';
// Mission 540: portable, read-only diagnostics bundle for GM review packages.
const {diagnoseGameBatchAuditReviewPackage}=require('./hlm-phase9-batch-audit-review-diagnostics');
const {formatGameBatchAuditReviewDiagnostics}=require('./hlm-phase9-batch-audit-review-diagnostics-text');
const {exportGameBatchAuditReviewDiagnosticsCsv}=require('./hlm-phase9-batch-audit-review-diagnostics-csv');
function bundleGameBatchAuditReviewDiagnostics({storage,json,originalAuditJson,receipt}={}){
 const args={storage,json,originalAuditJson,receipt};
 const report=diagnoseGameBatchAuditReviewPackage(args);
 const text=formatGameBatchAuditReviewDiagnostics(args);
 const csv=exportGameBatchAuditReviewDiagnosticsCsv(args);
 if(report.valid!==text.valid||report.valid!==csv.valid)
  throw Object.assign(new Error('Diagnostics export verification mismatch'),{code:'GAME_BATCH_DIAGNOSTICS_BUNDLE_MISMATCH'});
 return Object.freeze({
  kind:'phase9-game-batch-audit-review-diagnostics-bundle',version:1,
  valid:report.valid,
  json:JSON.stringify(report,null,2)+'\n',
  csv:csv.csv,text:text.text,
  formats:Object.freeze(['json','csv','text']),
  persistencePerformed:false,activeFranchiseSlotReplaced:false
 });
}
module.exports={bundleGameBatchAuditReviewDiagnostics};
