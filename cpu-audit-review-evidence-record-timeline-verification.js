(function(root){
'use strict';
// Verify an advisory human-review gate against its validated public aggregate timeline.
const bundles=(typeof module!=='undefined'&&module.exports)?require('./cpu-audit-review-evidence-record-timeline-bundle'):root.HFMCPUAuditReviewEvidenceRecordTimelineBundle;
const gates=(typeof module!=='undefined'&&module.exports)?require('./cpu-audit-review-evidence-record-timeline-gate'):root.HFMCPUAuditReviewEvidenceRecordTimelineGate;
function verify(bundle,gate){
 const valid=bundles.validate(bundle),expected=gates.assess(valid);
 if(!gate||typeof gate!=='object'||Array.isArray(gate)||gate.kind!=='cpu-audit-review-evidence-record-timeline-gate'||gate.readOnly!==true||gate.requiresHumanReview!==expected.requiresHumanReview||gate.snapshotCount!==expected.snapshotCount||!Array.isArray(gate.reasons)||gate.reasons.length!==expected.reasons.length||gate.reasons.some((reason,index)=>reason!==expected.reasons[index]))throw new TypeError('Review evidence record timeline gate does not match its aggregate bundle');
 return Object.freeze({kind:'cpu-audit-review-evidence-record-timeline-verification',readOnly:true,consistent:true,requiresHumanReview:expected.requiresHumanReview,snapshotCount:expected.snapshotCount});
}
function check(bundle){const valid=bundles.validate(bundle);return verify(valid,gates.assess(valid));}
const api=Object.freeze({verify,check});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.HFMCPUAuditReviewEvidenceRecordTimelineVerification=api;
})(typeof globalThis!=='undefined'?globalThis:this);
