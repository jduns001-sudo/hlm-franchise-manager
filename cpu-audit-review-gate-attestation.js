(function(root){
'use strict';
// Immutable, public-only attestation of a validated human-review gate decision.
const bundles=(typeof module!=='undefined'&&module.exports)?require('./cpu-audit-review-trend-bundle'):root.HFMCPUAuditReviewTrendBundle;
const gate=(typeof module!=='undefined'&&module.exports)?require('./cpu-audit-review-trend-gate'):root.HFMCPUAuditReviewTrendGate;
const verifier=(typeof module!=='undefined'&&module.exports)?require('./cpu-audit-review-trend-gate-verification'):root.HFMCPUAuditReviewTrendGateVerification;
function create(input){
 const canonical=bundles.validate(input);
 const decision=verifier.verify(canonical,gate.assess(canonical));
 return Object.freeze({kind:'cpu-audit-review-gate-attestation',readOnly:true,requiresHumanReview:decision.requiresHumanReview,snapshotCount:decision.snapshotCount,reasons:Object.freeze([...decision.reasons])});
}
function validate(input,attestation){
 const expected=create(input);
 if(!attestation||typeof attestation!=='object'||Array.isArray(attestation)||
  Object.keys(attestation).sort().join('|')!=='kind|readOnly|reasons|requiresHumanReview|snapshotCount'||
  attestation.kind!==expected.kind||attestation.readOnly!==true||
  attestation.requiresHumanReview!==expected.requiresHumanReview||
  attestation.snapshotCount!==expected.snapshotCount||!Array.isArray(attestation.reasons)||
  attestation.reasons.length!==expected.reasons.length||
  attestation.reasons.some((reason,i)=>reason!==expected.reasons[i]))
  throw new TypeError('Review gate attestation mismatch');
 return expected;
}
const api=Object.freeze({create,validate});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.HFMCPUAuditReviewGateAttestation=api;
})(typeof globalThis!=='undefined'?globalThis:this);
