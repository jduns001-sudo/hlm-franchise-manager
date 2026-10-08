(function(root){
'use strict';
// Deterministic, human-readable summary of verified public advisory evidence.
const bundles=(typeof module!=='undefined'&&module.exports)?require('./cpu-audit-review-attestation-bundle'):root.HFMCPUAuditReviewAttestationBundle;
function describe(input){
 const value=bundles.validate(input);
 const att=value.attestation;
 const lines=[
  'CPU aggregate review attestation (read-only)',
  'Snapshots: '+att.snapshotCount,
  'Human review: '+(att.requiresHumanReview?'required':'not required'),
  'Reasons: '+(att.reasons.length?att.reasons.join('; '):'none')
 ];
 return lines.join('\n');
}
const api=Object.freeze({describe});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.HFMCPUAuditReviewAttestationPresentation=api;
})(typeof globalThis!=='undefined'?globalThis:this);
