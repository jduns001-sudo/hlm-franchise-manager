(function(root){
'use strict';
// Reproducible aggregate-only timeline series review evidence, never action authority.
const bundles=(typeof module!=='undefined'&&module.exports)?require('./cpu-audit-review-evidence-record-history-timeline-series-bundle'):root.HFMCPUAuditReviewEvidenceRecordHistoryTimelineSeriesBundle;
const gates=(typeof module!=='undefined'&&module.exports)?require('./cpu-audit-review-evidence-record-history-timeline-series-gate'):root.HFMCPUAuditReviewEvidenceRecordHistoryTimelineSeriesGate;
const verification=(typeof module!=='undefined'&&module.exports)?require('./cpu-audit-review-evidence-record-history-timeline-series-verification'):root.HFMCPUAuditReviewEvidenceRecordHistoryTimelineSeriesVerification;
const exports=(typeof module!=='undefined'&&module.exports)?require('./cpu-audit-review-evidence-record-history-timeline-series-export'):root.HFMCPUAuditReviewEvidenceRecordHistoryTimelineSeriesExport;
const presentation=(typeof module!=='undefined'&&module.exports)?require('./cpu-audit-review-evidence-record-history-timeline-series-presentation'):root.HFMCPUAuditReviewEvidenceRecordHistoryTimelineSeriesPresentation;
const KIND='cpu-audit-public-review-evidence-record-history-timeline-series-evidence';
function create(bundle){
 const valid=bundles.validate(bundle),gate=gates.assess(valid);
 verification.verify(valid,gate);
 return Object.freeze({kind:KIND,readOnly:true,summary:valid.summary,requiresHumanReview:gate.requiresHumanReview,reasons:gate.reasons});
}
function validate(value){
 if(!value||typeof value!=='object'||Array.isArray(value)||value.kind!==KIND||value.readOnly!==true||!Array.isArray(value.reasons))throw new TypeError('Invalid review evidence record history timeline series evidence');
 const summary=exports.validate(value.summary);
 const expected=create({kind:'cpu-audit-public-review-evidence-record-history-timeline-series-bundle',readOnly:true,summary,text:presentation.describe(summary)});
 if(value.requiresHumanReview!==expected.requiresHumanReview||value.reasons.length!==expected.reasons.length||value.reasons.some((reason,index)=>reason!==expected.reasons[index]))throw new TypeError('Review evidence record history timeline series evidence mismatch');
 return expected;
}
function stringify(value){return JSON.stringify(validate(value));}
function parse(value){if(typeof value!=='string'||value.length>1024)throw new TypeError('Invalid review evidence record history timeline series evidence JSON');return validate(JSON.parse(value));}
const api=Object.freeze({create,validate,stringify,parse});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.HFMCPUAuditReviewEvidenceRecordHistoryTimelineSeriesEvidence=api;
})(typeof globalThis!=='undefined'?globalThis:this);
