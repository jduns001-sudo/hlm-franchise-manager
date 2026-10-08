(function(root){
'use strict';
// Validate a review gate against its originating aggregate trend bundle.
const bundles=(typeof module!=='undefined'&&module.exports)?require('./cpu-audit-review-trend-bundle'):root.HFMCPUAuditReviewTrendBundle;
const gates=(typeof module!=='undefined'&&module.exports)?require('./cpu-audit-review-trend-gate'):root.HFMCPUAuditReviewTrendGate;
function verify(bundle,gate){
 const valid=bundles.validate(bundle),expected=gates.assess(valid);
 if(!gate||typeof gate!=='object'||Array.isArray(gate)||gate.kind!=='cpu-audit-review-trend-gate'||gate.readOnly!==true||gate.requiresHumanReview!==expected.requiresHumanReview||gate.snapshotCount!==expected.snapshotCount||!Array.isArray(gate.reasons)||gate.reasons.length!==expected.reasons.length||gate.reasons.some((reason,index)=>reason!==expected.reasons[index]))throw new TypeError('Review trend gate does not match its aggregate bundle');
 return Object.freeze({kind:'cpu-audit-review-trend-verification',readOnly:true,consistent:true,requiresHumanReview:expected.requiresHumanReview,snapshotCount:expected.snapshotCount});
}
function check(bundle){const valid=bundles.validate(bundle);return verify(valid,gates.assess(valid));}
const api=Object.freeze({verify,check});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.HFMCPUAuditReviewTrendVerification=api;
})(typeof globalThis!=='undefined'?globalThis:this);
