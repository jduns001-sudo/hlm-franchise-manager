(function(root){
'use strict';
// Reproducible aggregate-only review evidence. Advisory, never action authority.
const bundles=(typeof module!=='undefined'&&module.exports)?require('./cpu-audit-review-evidence-record-history-bundle'):root.HFMCPUAuditReviewEvidenceRecordHistoryBundle;
const gates=(typeof module!=='undefined'&&module.exports)?require('./cpu-audit-review-evidence-record-history-gate'):root.HFMCPUAuditReviewEvidenceRecordHistoryGate;
const verification=(typeof module!=='undefined'&&module.exports)?require('./cpu-audit-review-evidence-record-history-verification'):root.HFMCPUAuditReviewEvidenceRecordHistoryVerification;
const exports=(typeof module!=='undefined'&&module.exports)?require('./cpu-audit-review-evidence-record-history-export'):root.HFMCPUAuditReviewEvidenceRecordHistoryExport;
const presentation=(typeof module!=='undefined'&&module.exports)?require('./cpu-audit-review-evidence-record-history-presentation'):root.HFMCPUAuditReviewEvidenceRecordHistoryPresentation;
function create(bundle){
 const valid=bundles.validate(bundle),gate=gates.assess(valid);
 verification.verify(valid,gate);
 return Object.freeze({kind:'cpu-audit-public-review-evidence-record-history-evidence',readOnly:true,summary:valid.summary,requiresHumanReview:gate.requiresHumanReview,reasons:gate.reasons});
}
function validate(value){
 if(!value||typeof value!=='object'||Array.isArray(value)||value.kind!=='cpu-audit-public-review-evidence-record-history-evidence'||value.readOnly!==true||!Array.isArray(value.reasons))throw new TypeError('Invalid review evidence record history evidence');
 const summary=exports.validate(value.summary);
 const expected=create({kind:'cpu-audit-public-review-evidence-record-history-bundle',readOnly:true,summary,text:presentation.describe(summary)});
 if(value.requiresHumanReview!==expected.requiresHumanReview||value.reasons.length!==expected.reasons.length||value.reasons.some((reason,index)=>reason!==expected.reasons[index]))throw new TypeError('Review evidence record history evidence mismatch');
 return expected;
}
function stringify(value){return JSON.stringify(validate(value));}
function parse(value){if(typeof value!=='string'||value.length>1024)throw new TypeError('Invalid review evidence record history evidence JSON');return validate(JSON.parse(value));}
const api=Object.freeze({create,validate,stringify,parse});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.HFMCPUAuditReviewEvidenceRecordHistoryEvidence=api;
})(typeof globalThis!=='undefined'?globalThis:this);
