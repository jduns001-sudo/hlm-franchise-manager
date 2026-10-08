(function(root){
'use strict';
// Cross-check advisory gate outcomes against a validated aggregate-only bundle.
const bundles=(typeof module!=='undefined'&&module.exports)?require('./cpu-audit-summary-bundle'):root.HFMCPUAuditSummaryBundle;
const gates=(typeof module!=='undefined'&&module.exports)?require('./cpu-audit-review-gate'):root.HFMCPUAuditReviewGate;
function verify(input,gate){
 const expected=gates.assess(input);
 if(!gate||typeof gate!=='object'||Array.isArray(gate)||gate.kind!=='cpu-audit-review-gate'||gate.readOnly!==true||gate.requiresHumanReview!==expected.requiresHumanReview||gate.reportCount!==expected.reportCount||!Array.isArray(gate.reasons)||gate.reasons.length!==expected.reasons.length||gate.reasons.some((x,i)=>x!==expected.reasons[i]))throw new TypeError('Advisory review gate does not match summary');
 return Object.freeze({kind:'cpu-audit-review-verification',readOnly:true,consistent:true,requiresHumanReview:expected.requiresHumanReview,reportCount:expected.reportCount});
}
function check(input){const b=bundles.validate(input);return verify(b,gates.assess(b));}
const api=Object.freeze({verify,check});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.HFMCPUAuditReviewVerification=api;
})(typeof globalThis!=='undefined'?globalThis:this);
