(function(root){
'use strict';
// Reproducible aggregate-only timeline review evidence, never action authority.
const bundles=(typeof module!=='undefined'&&module.exports)?require('./cpu-audit-review-evidence-record-history-timeline-bundle'):root.HFMCPUAuditReviewEvidenceRecordHistoryTimelineBundle;
const gates=(typeof module!=='undefined'&&module.exports)?require('./cpu-audit-review-evidence-record-history-timeline-gate'):root.HFMCPUAuditReviewEvidenceRecordHistoryTimelineGate;
const verification=(typeof module!=='undefined'&&module.exports)?require('./cpu-audit-review-evidence-record-history-timeline-verification'):root.HFMCPUAuditReviewEvidenceRecordHistoryTimelineVerification;
const exports=(typeof module!=='undefined'&&module.exports)?require('./cpu-audit-review-evidence-record-history-timeline-export'):root.HFMCPUAuditReviewEvidenceRecordHistoryTimelineExport;
const presentation=(typeof module!=='undefined'&&module.exports)?require('./cpu-audit-review-evidence-record-history-timeline-presentation'):root.HFMCPUAuditReviewEvidenceRecordHistoryTimelinePresentation;
function create(bundle){
 const valid=bundles.validate(bundle),gate=gates.assess(valid);
 verification.verify(valid,gate);
 return Object.freeze({kind:'cpu-audit-public-review-evidence-record-history-timeline-evidence',readOnly:true,summary:valid.summary,requiresHumanReview:gate.requiresHumanReview,reasons:gate.reasons});
}
function validate(value){
 if(!value||typeof value!=='object'||Array.isArray(value)||value.kind!=='cpu-audit-public-review-evidence-record-history-timeline-evidence'||value.readOnly!==true||!Array.isArray(value.reasons))throw new TypeError('Invalid review evidence record history timeline evidence');
 const summary=exports.validate(value.summary);
 const expected=create({kind:'cpu-audit-public-review-evidence-record-history-timeline-bundle',readOnly:true,summary,text:presentation.describe(summary)});
 if(value.requiresHumanReview!==expected.requiresHumanReview||value.reasons.length!==expected.reasons.length||value.reasons.some((reason,index)=>reason!==expected.reasons[index]))throw new TypeError('Review evidence record history timeline evidence mismatch');
 return expected;
}
function stringify(value){return JSON.stringify(validate(value));}
function parse(value){if(typeof value!=='string'||value.length>1024)throw new TypeError('Invalid review evidence record history timeline evidence JSON');return validate(JSON.parse(value));}
const api=Object.freeze({create,validate,stringify,parse});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.HFMCPUAuditReviewEvidenceRecordHistoryTimelineEvidence=api;
})(typeof globalThis!=='undefined'?globalThis:this);
