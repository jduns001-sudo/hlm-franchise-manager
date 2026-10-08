(function(root){
'use strict';
// Deterministic read-only text for validated aggregate review record timeline counts.
const exports=(typeof module!=='undefined'&&module.exports)?require('./cpu-audit-review-evidence-record-timeline-export'):root.HFMCPUAuditReviewEvidenceRecordTimelineExport;
function lines(input){
 const s=exports.validate(input);
 return Object.freeze([
  'Aggregate review evidence record timeline (read-only)',
  'Snapshots: '+s.count,
  'Human-review snapshots: '+s.reviewCount,
  'Review state changes: '+s.reviewStateChanges,
  'Transitions: '+s.transitionCount
 ]);
}
function describe(input){return lines(input).join('\n');}
const api=Object.freeze({lines,describe});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.HFMCPUAuditReviewEvidenceRecordTimelinePresentation=api;
})(typeof globalThis!=='undefined'?globalThis:this);
