(function(root){
'use strict';
// Independent consistency check for public aggregate review history gate.
const bundles=(typeof module!=='undefined'&&module.exports)?require('./cpu-audit-review-evidence-record-history-bundle'):root.HFMCPUAuditReviewEvidenceRecordHistoryBundle;
const gates=(typeof module!=='undefined'&&module.exports)?require('./cpu-audit-review-evidence-record-history-gate'):root.HFMCPUAuditReviewEvidenceRecordHistoryGate;
function verify(bundle,gate){
 const valid=bundles.validate(bundle),expected=gates.assess(valid);
 if(!gate||typeof gate!=='object'||Array.isArray(gate)||gate.kind!==expected.kind||gate.readOnly!==true||gate.requiresHumanReview!==expected.requiresHumanReview||gate.snapshotCount!==expected.snapshotCount||!Array.isArray(gate.reasons)||gate.reasons.length!==expected.reasons.length||gate.reasons.some((reason,i)=>reason!==expected.reasons[i]))throw new TypeError('Review evidence record history gate verification mismatch');
 return Object.freeze({kind:'cpu-audit-review-evidence-record-history-verification',readOnly:true,verified:true,requiresHumanReview:expected.requiresHumanReview,snapshotCount:expected.snapshotCount});
}
const api=Object.freeze({verify});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.HFMCPUAuditReviewEvidenceRecordHistoryVerification=api;
})(typeof globalThis!=='undefined'?globalThis:this);
