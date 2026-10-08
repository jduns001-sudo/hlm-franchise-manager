(function(root){
'use strict';
// Reproducible, aggregate-only advisory review evidence. Never authorizes actions.
const bundles=(typeof module!=='undefined'&&module.exports)?require('./cpu-audit-review-evidence-timeline-bundle'):root.HFMCPUAuditReviewEvidenceTimelineBundle;
const gates=(typeof module!=='undefined'&&module.exports)?require('./cpu-audit-review-evidence-timeline-gate'):root.HFMCPUAuditReviewEvidenceTimelineGate;
const verification=(typeof module!=='undefined'&&module.exports)?require('./cpu-audit-review-evidence-timeline-verification'):root.HFMCPUAuditReviewEvidenceTimelineVerification;
const exports=(typeof module!=='undefined'&&module.exports)?require('./cpu-audit-review-evidence-timeline-export'):root.HFMCPUAuditReviewEvidenceTimelineExport;
const presentation=(typeof module!=='undefined'&&module.exports)?require('./cpu-audit-review-evidence-timeline-presentation'):root.HFMCPUAuditReviewEvidenceTimelinePresentation;
function create(bundle){
 const valid=bundles.validate(bundle),gate=gates.assess(valid);
 verification.verify(valid,gate);
 return Object.freeze({kind:'cpu-audit-public-review-evidence-timeline-record',readOnly:true,summary:valid.summary,requiresHumanReview:gate.requiresHumanReview,reasons:gate.reasons});
}
function validate(value){
 if(!value||typeof value!=='object'||Array.isArray(value)||value.kind!=='cpu-audit-public-review-evidence-timeline-record'||value.readOnly!==true||!Array.isArray(value.reasons))throw new TypeError('Invalid review evidence timeline record');
 const summary=exports.validate(value.summary);
 const expected=create({kind:'cpu-audit-public-review-evidence-timeline-bundle',readOnly:true,summary,text:presentation.describe(summary)});
 if(value.requiresHumanReview!==expected.requiresHumanReview||value.reasons.length!==expected.reasons.length||value.reasons.some((reason,index)=>reason!==expected.reasons[index]))throw new TypeError('Review evidence timeline record mismatch');
 return expected;
}
function stringify(value){return JSON.stringify(validate(value));}
function parse(value){if(typeof value!=='string'||value.length>1024)throw new TypeError('Invalid review evidence timeline record JSON');return validate(JSON.parse(value));}
const api=Object.freeze({create,validate,stringify,parse});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.HFMCPUAuditReviewEvidenceTimelineRecord=api;
})(typeof globalThis!=='undefined'?globalThis:this);
