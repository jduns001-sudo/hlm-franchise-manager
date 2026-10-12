'use strict';
// Mission 537: actionable, read-only diagnostics for portable GM review packages.
const {validateGameBatchAuditReviewPackageAgainstSaves}=require('./hlm-phase9-batch-audit-review-package-save-validation');
const EXPLANATIONS=Object.freeze({
 INVALID_JSON:'The review package is not valid JSON. Export it again.',
 INVALID_PACKAGE:'The review package is missing required files or metadata.',
 INVALID_REVIEW_PACKAGE:'The review package contains unreadable review data.',
 INVALID_REVIEW_JSON:'The embedded review summary is not valid JSON.',
 SOURCE_AUDIT_REVIEW_NOT_VERIFIED:'The source audit or GM receipt failed verification. Check the original audit and saved franchise.',
 PACKAGED_REVIEW_NOT_VERIFIED:'The packaged GM review was not verified.',
 VERIFICATION_STATUS_MISMATCH:'The packaged verification status does not agree with its manifest.'
});
function explain(error){
 if(EXPLANATIONS[error])return EXPLANATIONS[error];
 if(error.startsWith('FINGERPRINT_MISMATCH_'))return 'Export content changed: '+error.slice(21)+'. Re-export the original package.';
 if(error.startsWith('REVIEW_MISMATCH_'))return 'The saved audit and package disagree on '+error.slice(16)+'. Revalidate the original review.';
 return 'Review package verification failed: '+error;
}
function diagnoseGameBatchAuditReviewPackage({storage,json,originalAuditJson,receipt}={}){
 const result=validateGameBatchAuditReviewPackageAgainstSaves({storage,json,originalAuditJson,receipt});
 return Object.freeze({
  kind:'phase9-game-batch-audit-review-diagnostics',version:1,
  valid:result.valid,status:result.valid?'READY':'ACTION_REQUIRED',
  issues:Object.freeze(result.errors.map(code=>Object.freeze({code,message:explain(code)}))),
  persistencePerformed:false,activeFranchiseSlotReplaced:false
 });
}
module.exports={diagnoseGameBatchAuditReviewPackage};
