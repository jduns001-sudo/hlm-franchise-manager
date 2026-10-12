'use strict';
// Mission 542: portable read-only GM review diagnostics package with integrity verification.
const {bundleGameBatchAuditReviewDiagnostics}=require('./hlm-phase9-batch-audit-review-diagnostics-bundle');
const {manifestGameBatchAuditReviewDiagnostics}=require('./hlm-phase9-batch-audit-review-diagnostics-manifest');
const {fingerprintGameBatchAuditReview}=require('./hlm-phase9-batch-audit-review-manifest');
function packageGameBatchAuditReviewDiagnostics({storage,json,originalAuditJson,receipt}={}){
 const args={storage,json,originalAuditJson,receipt};
 const bundle=bundleGameBatchAuditReviewDiagnostics(args);
 const manifest=manifestGameBatchAuditReviewDiagnostics(args);
 const payload={kind:'phase9-game-batch-audit-review-diagnostics-package',version:1,
  valid:bundle.valid,files:{'diagnostics.json':bundle.json,'diagnostics.csv':bundle.csv,'diagnostics.txt':bundle.text},manifest};
 return Object.freeze({kind:payload.kind,version:1,valid:bundle.valid,
  json:JSON.stringify(payload,null,2)+'\n',
  persistencePerformed:false,activeFranchiseSlotReplaced:false});
}
function inspectGameBatchAuditReviewDiagnosticsPackage(json){
 let payload;
 try{payload=JSON.parse(json);}catch(_){return Object.freeze({valid:false,errors:Object.freeze(['INVALID_JSON'])});}
 const errors=[];
 if(!payload||payload.kind!=='phase9-game-batch-audit-review-diagnostics-package'||payload.version!==1||
  !payload.files||!payload.manifest)errors.push('INVALID_PACKAGE');
 else{
  for(const [file,key] of [['diagnostics.json','jsonFingerprint'],['diagnostics.csv','csvFingerprint'],['diagnostics.txt','textFingerprint']]){
   if(typeof payload.files[file]!=='string'||fingerprintGameBatchAuditReview(payload.files[file])!==payload.manifest[key])
    errors.push('FINGERPRINT_MISMATCH_'+file);
  }
  try{
   const report=JSON.parse(payload.files['diagnostics.json']);
   if(report.valid!==payload.valid||payload.manifest.valid!==payload.valid)
    errors.push('VALIDATION_STATUS_MISMATCH');
  }catch(_){errors.push('INVALID_DIAGNOSTICS_JSON');}
 }
 return Object.freeze({valid:errors.length===0,errors:Object.freeze(errors)});
}
module.exports={packageGameBatchAuditReviewDiagnostics,inspectGameBatchAuditReviewDiagnosticsPackage};
