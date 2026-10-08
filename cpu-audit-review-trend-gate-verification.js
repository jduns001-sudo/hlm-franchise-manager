(function(root){
'use strict';
// Verify an advisory review-gate decision against canonical aggregate trend evidence.
const bundles=(typeof module!=='undefined'&&module.exports)?require('./cpu-audit-review-trend-bundle'):root.HFMCPUAuditReviewTrendBundle;
const gate=(typeof module!=='undefined'&&module.exports)?require('./cpu-audit-review-trend-gate'):root.HFMCPUAuditReviewTrendGate;
function verify(input,decision){
 const canonical=bundles.validate(input);
 const expected=gate.assess(canonical);
 if(!decision||typeof decision!=='object'||Array.isArray(decision)||
    Object.keys(decision).sort().join('|')!=='kind|readOnly|reasons|requiresHumanReview|snapshotCount'||
    decision.kind!==expected.kind||decision.readOnly!==true||
    decision.requiresHumanReview!==expected.requiresHumanReview||
    decision.snapshotCount!==expected.snapshotCount||!Array.isArray(decision.reasons)||
    decision.reasons.length!==expected.reasons.length||
    decision.reasons.some((reason,i)=>reason!==expected.reasons[i])){
   throw new TypeError('Aggregate review gate decision mismatch');
 }
 return expected;
}
const api=Object.freeze({verify});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.HFMCPUAuditReviewTrendGateVerification=api;
})(typeof globalThis!=='undefined'?globalThis:this);
