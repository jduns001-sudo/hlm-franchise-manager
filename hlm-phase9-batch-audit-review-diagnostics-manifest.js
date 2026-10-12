'use strict';
// Mission 541: integrity fingerprints for portable GM review diagnostics exports.
const {bundleGameBatchAuditReviewDiagnostics}=require('./hlm-phase9-batch-audit-review-diagnostics-bundle');
const {fingerprintGameBatchAuditReview}=require('./hlm-phase9-batch-audit-review-manifest');
function manifestGameBatchAuditReviewDiagnostics({storage,json,originalAuditJson,receipt}={}){
 const bundle=bundleGameBatchAuditReviewDiagnostics({storage,json,originalAuditJson,receipt});
 return Object.freeze({
  kind:'phase9-game-batch-audit-review-diagnostics-manifest',version:1,
  valid:bundle.valid,
  jsonFingerprint:fingerprintGameBatchAuditReview(bundle.json),
  csvFingerprint:fingerprintGameBatchAuditReview(bundle.csv),
  textFingerprint:fingerprintGameBatchAuditReview(bundle.text),
  formats:Object.freeze(['json','csv','text']),
  persistencePerformed:false,activeFranchiseSlotReplaced:false
 });
}
module.exports={manifestGameBatchAuditReviewDiagnostics};
