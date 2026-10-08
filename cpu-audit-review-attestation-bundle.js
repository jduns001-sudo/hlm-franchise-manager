(function(root){
'use strict';
// Portable, read-only attestation bundle. Every field is recomputed on validation.
const trends=(typeof module!=='undefined'&&module.exports)?require('./cpu-audit-review-trend-bundle'):root.HFMCPUAuditReviewTrendBundle;
const attest=(typeof module!=='undefined'&&module.exports)?require('./cpu-audit-review-gate-attestation'):root.HFMCPUAuditReviewGateAttestation;
function create(input){
 const trend=trends.validate(input);
 return Object.freeze({kind:'cpu-audit-review-attestation-bundle',readOnly:true,trend,attestation:attest.create(trend)});
}
function validate(value){
 if(!value||typeof value!=='object'||Array.isArray(value)||
  Object.keys(value).sort().join('|')!=='attestation|kind|readOnly|trend'||
  value.kind!=='cpu-audit-review-attestation-bundle'||value.readOnly!==true)
  throw new TypeError('Invalid review attestation bundle');
 const trend=trends.validate(value.trend);
 const attestation=attest.validate(trend,value.attestation);
 return Object.freeze({kind:'cpu-audit-review-attestation-bundle',readOnly:true,trend,attestation});
}
function stringify(value){return JSON.stringify(validate(value));}
function parse(value){
 if(typeof value!=='string'||value.length>4096)throw new TypeError('Invalid review attestation bundle JSON');
 return validate(JSON.parse(value));
}
const api=Object.freeze({create,validate,stringify,parse});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.HFMCPUAuditReviewAttestationBundle=api;
})(typeof globalThis!=='undefined'?globalThis:this);
