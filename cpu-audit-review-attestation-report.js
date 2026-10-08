(function(root){
'use strict';
// Read-only report that binds a verified attestation to its deterministic text.
const bundles=(typeof module!=='undefined'&&module.exports)?require('./cpu-audit-review-attestation-bundle'):root.HFMCPUAuditReviewAttestationBundle;
const presentation=(typeof module!=='undefined'&&module.exports)?require('./cpu-audit-review-attestation-presentation'):root.HFMCPUAuditReviewAttestationPresentation;
function create(input){
 const bundle=bundles.validate(input);
 return Object.freeze({kind:'cpu-audit-review-attestation-report',readOnly:true,bundle,text:presentation.describe(bundle)});
}
function validate(input){
 if(!input||typeof input!=='object'||Array.isArray(input)||
  Object.keys(input).sort().join('|')!=='bundle|kind|readOnly|text'||
  input.kind!=='cpu-audit-review-attestation-report'||input.readOnly!==true)
  throw new TypeError('Invalid review attestation report');
 const bundle=bundles.validate(input.bundle);
 const expected=presentation.describe(bundle);
 if(input.text!==expected)throw new TypeError('Review attestation report text mismatch');
 return Object.freeze({kind:'cpu-audit-review-attestation-report',readOnly:true,bundle,text:expected});
}
function stringify(value){return JSON.stringify(validate(value));}
function parse(value){
 if(typeof value!=='string'||value.length>8192)throw new TypeError('Invalid review attestation report JSON');
 return validate(JSON.parse(value));
}
const api=Object.freeze({create,validate,stringify,parse});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.HFMCPUAuditReviewAttestationReport=api;
})(typeof globalThis!=='undefined'?globalThis:this);
