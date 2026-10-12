'use strict';
// Mission 536: validate a portable GM review package against the current saved franchise.
const {inspectGameBatchAuditReviewPackage}=require('./hlm-phase9-batch-audit-review-package');
const {summarizeGameBatchAuditReview}=require('./hlm-phase9-batch-audit-review-summary');
function validateGameBatchAuditReviewPackageAgainstSaves({storage,json,originalAuditJson,receipt}={}){
 const inspection=inspectGameBatchAuditReviewPackage(json);
 if(!inspection.valid)return Object.freeze({valid:false,errors:inspection.errors,
  persistencePerformed:false,activeFranchiseSlotReplaced:false});
 let payload,embedded;
 try{payload=JSON.parse(json);embedded=JSON.parse(payload.files['review.json']);}
 catch(_){return Object.freeze({valid:false,errors:Object.freeze(['INVALID_REVIEW_PACKAGE']),
  persistencePerformed:false,activeFranchiseSlotReplaced:false});}
 const actual=summarizeGameBatchAuditReview({storage,json:originalAuditJson,receipt});
 const errors=[];
 if(!actual.verified)errors.push('SOURCE_AUDIT_REVIEW_NOT_VERIFIED');
 if(!embedded.verified)errors.push('PACKAGED_REVIEW_NOT_VERIFIED');
 for(const key of ['status','verified','reviewerId','gameCount','sourceSlotId','destinationSlotId',
 'jsonFingerprint','csvFingerprint','textFingerprint','approvalConfirmed']){
  if(embedded[key]!==actual[key])errors.push('REVIEW_MISMATCH_'+key);
 }
 return Object.freeze({valid:errors.length===0,errors:Object.freeze(errors),
  persistencePerformed:false,activeFranchiseSlotReplaced:false});
}
module.exports={validateGameBatchAuditReviewPackageAgainstSaves};
