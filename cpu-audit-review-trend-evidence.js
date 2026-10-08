(function(root){
'use strict';
// Reproducible public aggregate trend review evidence, with no save mutations.
const bundles=(typeof module!=='undefined'&&module.exports)?require('./cpu-audit-review-trend-bundle'):root.HFMCPUAuditReviewTrendBundle;
const gates=(typeof module!=='undefined'&&module.exports)?require('./cpu-audit-review-trend-gate'):root.HFMCPUAuditReviewTrendGate;
const checks=(typeof module!=='undefined'&&module.exports)?require('./cpu-audit-review-trend-verification'):root.HFMCPUAuditReviewTrendVerification;
function create(bundle){
 const valid=bundles.validate(bundle),gate=gates.assess(valid);
 checks.verify(valid,gate);
 return Object.freeze({kind:'cpu-audit-public-review-trend-evidence',readOnly:true,summary:valid.summary,requiresHumanReview:gate.requiresHumanReview,reasons:gate.reasons});
}
function validate(value){
 if(!value||typeof value!=='object'||Array.isArray(value)||value.kind!=='cpu-audit-public-review-trend-evidence'||value.readOnly!==true||!Array.isArray(value.reasons))throw new TypeError('Invalid public review trend evidence');
 const summary=(typeof module!=='undefined'&&module.exports?require('./cpu-audit-review-trend-export'):root.HFMCPUAuditReviewTrendExport).validate(value.summary);
 const text=(typeof module!=='undefined'&&module.exports?require('./cpu-audit-review-trend-presentation'):root.HFMCPUAuditReviewTrendPresentation).describe(summary);
 const expected=create({kind:'cpu-audit-public-review-trend-bundle',readOnly:true,summary,text});
 if(value.requiresHumanReview!==expected.requiresHumanReview||value.reasons.length!==expected.reasons.length||value.reasons.some((x,i)=>x!==expected.reasons[i]))throw new TypeError('Public review trend evidence mismatch');
 return expected;
}
function stringify(value){return JSON.stringify(validate(value));}
function parse(value){if(typeof value!=='string'||value.length>1024)throw new TypeError('Invalid public review trend evidence JSON');return validate(JSON.parse(value));}
const api=Object.freeze({create,validate,stringify,parse});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.HFMCPUAuditReviewTrendEvidence=api;
})(typeof globalThis!=='undefined'?globalThis:this);
