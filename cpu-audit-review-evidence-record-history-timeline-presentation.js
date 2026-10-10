(function(root){
'use strict';
// Deterministic read-only presentation of validated public aggregate history timeline.
const exports=(typeof module!=='undefined'&&module.exports)?require('./cpu-audit-review-evidence-record-history-timeline-export'):root.HFMCPUAuditReviewEvidenceRecordHistoryTimelineExport;
function lines(input){
 const s=exports.validate(input);
 return Object.freeze([
  'Aggregate review evidence record history timeline (read-only)',
  'Snapshots: '+s.count,
  'Human-review snapshots: '+s.reviewCount,
  'Review state changes: '+s.reviewStateChanges,
  'Transitions: '+s.transitionCount
 ]);
}
function describe(input){return lines(input).join('\n');}
const api=Object.freeze({lines,describe});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.HFMCPUAuditReviewEvidenceRecordHistoryTimelinePresentation=api;
})(typeof globalThis!=='undefined'?globalThis:this);
