(function(root){
'use strict';
// Reproducible, aggregate-only review evidence; never grants CPU write authority.
const bundles=(typeof module!=='undefined'&&module.exports)?require('./cpu-audit-summary-bundle'):root.HFMCPUAuditSummaryBundle;
const gates=(typeof module!=='undefined'&&module.exports)?require('./cpu-audit-review-gate'):root.HFMCPUAuditReviewGate;
const verification=(typeof module!=='undefined'&&module.exports)?require('./cpu-audit-review-verification'):root.HFMCPUAuditReviewVerification;
function create(input){
 const bundle=bundles.validate(input);
 const gate=gates.assess(bundle);
 verification.verify(bundle,gate);
 return Object.freeze({kind:'cpu-audit-public-review-evidence',readOnly:true,summary:bundle.summary,requiresHumanReview:gate.requiresHumanReview,reasons:gate.reasons});
}
function validate(input){
 if(!input||typeof input!=='object'||Array.isArray(input)||input.kind!=='cpu-audit-public-review-evidence'||input.readOnly!==true||!Array.isArray(input.reasons))throw new TypeError('Invalid review evidence');
 const summary=bundles.validate({kind:'cpu-audit-summary-bundle',readOnly:true,summary:input.summary,text:(typeof module!=='undefined'&&module.exports?require('./cpu-audit-timeline-presentation'):root.HFMCPUAuditTimelinePresentation).describe(input.summary)});
 const expected=create(summary);
 if(input.requiresHumanReview!==expected.requiresHumanReview||input.reasons.length!==expected.reasons.length||input.reasons.some((reason,i)=>reason!==expected.reasons[i]))throw new TypeError('Review evidence mismatch');
 return expected;
}
function stringify(input){return JSON.stringify(validate(input));}
function parse(text){if(typeof text!=='string'||text.length>1024)throw new TypeError('Invalid review evidence JSON');return validate(JSON.parse(text));}
const api=Object.freeze({create,validate,stringify,parse});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.HFMCPUAuditReviewEvidence=api;
})(typeof globalThis!=='undefined'?globalThis:this);
