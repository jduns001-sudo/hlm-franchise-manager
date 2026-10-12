'use strict';
// Mission 543: compare a portable diagnostics package to a fresh, read-only verification.
const {packageGameBatchAuditReviewDiagnostics,inspectGameBatchAuditReviewDiagnosticsPackage}=require('./hlm-phase9-batch-audit-review-diagnostics-package');
function validateGameBatchAuditReviewDiagnosticsPackageAgainstSaves({storage,json,originalReviewPackageJson,originalAuditJson,receipt}={}){
 const inspection=inspectGameBatchAuditReviewDiagnosticsPackage(json);
 const errors=[...inspection.errors];
 if(inspection.valid){
  let supplied;
  try{supplied=JSON.parse(json);}catch(_){errors.push('INVALID_PACKAGE');}
  if(supplied){
   const fresh=packageGameBatchAuditReviewDiagnostics({storage,json:originalReviewPackageJson,originalAuditJson,receipt});
   const expected=JSON.parse(fresh.json);
   if(supplied.valid!==expected.valid)errors.push('DIAGNOSTICS_STATUS_MISMATCH');
   for(const filename of ['diagnostics.json','diagnostics.csv','diagnostics.txt']){
    if(supplied.files[filename]!==expected.files[filename])errors.push('DIAGNOSTICS_CONTENT_MISMATCH_'+filename);
   }
  }
 }
 return Object.freeze({valid:errors.length===0,errors:Object.freeze(errors),
  persistencePerformed:false,activeFranchiseSlotReplaced:false});
}
module.exports={validateGameBatchAuditReviewDiagnosticsPackageAgainstSaves};
