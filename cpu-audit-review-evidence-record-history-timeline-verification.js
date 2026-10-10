(function(root){
'use strict';
// Recheck aggregate-only human-review gate decisions against validated timeline bundle.
const bundles=(typeof module!=='undefined'&&module.exports)?require('./cpu-audit-review-evidence-record-history-timeline-bundle'):root.HFMCPUAuditReviewEvidenceRecordHistoryTimelineBundle;
const gates=(typeof module!=='undefined'&&module.exports)?require('./cpu-audit-review-evidence-record-history-timeline-gate'):root.HFMCPUAuditReviewEvidenceRecordHistoryTimelineGate;
function verify(bundle,gate){
 const valid=bundles.validate(bundle),expected=gates.assess(valid);
 if(!gate||typeof gate!=='object'||Array.isArray(gate)||gate.kind!==expected.kind||gate.readOnly!==true||gate.requiresHumanReview!==expected.requiresHumanReview||gate.snapshotCount!==expected.snapshotCount||!Array.isArray(gate.reasons)||gate.reasons.length!==expected.reasons.length||gate.reasons.some((reason,index)=>reason!==expected.reasons[index]))throw new TypeError('Review evidence record history timeline gate verification failed');
 return Object.freeze({kind:'cpu-audit-review-evidence-record-history-timeline-verification',readOnly:true,verified:true,requiresHumanReview:expected.requiresHumanReview,snapshotCount:expected.snapshotCount});
}
const api=Object.freeze({verify});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.HFMCPUAuditReviewEvidenceRecordHistoryTimelineVerification=api;
})(typeof globalThis!=='undefined'?globalThis:this);
