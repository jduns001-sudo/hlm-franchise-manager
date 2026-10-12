'use strict';
// Mission 543: verify portable diagnostics packages against current saved franchise data.
const {inspectGameBatchAuditReviewDiagnosticsPackage}=require('./hlm-phase9-batch-audit-review-diagnostics-package');
const {diagnoseGameBatchAuditReviewPackage}=require('./hlm-phase9-batch-audit-review-diagnostics');
function verifyGameBatchAuditReviewDiagnosticsPackageAgainstSaves({storage,json,reviewPackageJson,originalAuditJson,receipt}={}){
 const inspection=inspectGameBatchAuditReviewDiagnosticsPackage(json);
 if(!inspection.valid)return Object.freeze({valid:false,errors:inspection.errors,
  persistencePerformed:false,activeFranchiseSlotReplaced:false});
 const payload=JSON.parse(json);
 const actual=diagnoseGameBatchAuditReviewPackage({storage,json:reviewPackageJson,originalAuditJson,receipt});
 const errors=[];
 let embedded;
 try{embedded=JSON.parse(payload.files['diagnostics.json']);}
 catch(_){errors.push('INVALID_DIAGNOSTICS_JSON');}
 if(embedded){
  if(embedded.kind!==actual.kind||embedded.version!==actual.version||embedded.valid!==actual.valid||
   embedded.status!==actual.status||JSON.stringify(embedded.issues)!==JSON.stringify(actual.issues))
   errors.push('DIAGNOSTICS_SAVE_MISMATCH');
 }
 return Object.freeze({valid:errors.length===0,errors:Object.freeze(errors),
  persistencePerformed:false,activeFranchiseSlotReplaced:false});
}
module.exports={verifyGameBatchAuditReviewDiagnosticsPackageAgainstSaves};
