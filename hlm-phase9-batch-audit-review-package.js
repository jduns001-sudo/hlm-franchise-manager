'use strict';
// Mission 535: portable read-only package of GM review exports with an integrity manifest.
const {bundleGameBatchAuditReview}=require('./hlm-phase9-batch-audit-review-export-bundle');
const {manifestGameBatchAuditReview,fingerprintGameBatchAuditReview}=require('./hlm-phase9-batch-audit-review-manifest');
function packageGameBatchAuditReview({storage,json,receipt}={}){
 const bundle=bundleGameBatchAuditReview({storage,json,receipt});
 const manifest=manifestGameBatchAuditReview({storage,json,receipt});
 const envelope={kind:'phase9-game-batch-audit-review-package',version:1,
  verified:bundle.verified,files:{'review.json':bundle.json,'review.csv':bundle.csv,'review.txt':bundle.text},
  manifest};
 return Object.freeze({
  kind:envelope.kind,version:1,verified:bundle.verified,
  json:JSON.stringify(envelope,null,2)+'\n',
  persistencePerformed:false,activeFranchiseSlotReplaced:false
 });
}
function inspectGameBatchAuditReviewPackage(json){
 const errors=[];
 let payload;
 try{payload=JSON.parse(json);}catch(_){return Object.freeze({valid:false,errors:Object.freeze(['INVALID_JSON'])});}
 if(!payload||payload.kind!=='phase9-game-batch-audit-review-package'||payload.version!==1||
 !payload.files||!payload.manifest)errors.push('INVALID_PACKAGE');
 else{
  for(const [file,key] of [['review.json','jsonFingerprint'],['review.csv','csvFingerprint'],['review.txt','textFingerprint']]){
   if(typeof payload.files[file]!=='string'||fingerprintGameBatchAuditReview(payload.files[file])!==payload.manifest[key])
    errors.push('FINGERPRINT_MISMATCH_'+file);
  }
  try{
   const summary=JSON.parse(payload.files['review.json']);
   if(summary.verified!==payload.verified||payload.manifest.verified!==payload.verified)
    errors.push('VERIFICATION_STATUS_MISMATCH');
  }catch(_){errors.push('INVALID_REVIEW_JSON');}
 }
 return Object.freeze({valid:errors.length===0,errors:Object.freeze(errors)});
}
module.exports={packageGameBatchAuditReview,inspectGameBatchAuditReviewPackage};
