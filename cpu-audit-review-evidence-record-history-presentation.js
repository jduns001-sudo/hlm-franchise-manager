(function(root){
'use strict';
// Deterministic read-only text for validated aggregate review evidence record history.
const exports=(typeof module!=='undefined'&&module.exports)?require('./cpu-audit-review-evidence-record-history-export'):root.HFMCPUAuditReviewEvidenceRecordHistoryExport;
function lines(input){
 const s=exports.validate(input);
 return Object.freeze([
  'Aggregate review evidence record history (read-only)',
  'Snapshots: '+s.count,
  'Human-review snapshots: '+s.reviewCount,
  'Review state changes: '+s.reviewStateChanges,
  'Transitions: '+s.transitionCount
 ]);
}
function describe(input){return lines(input).join('\n');}
const api=Object.freeze({lines,describe});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.HFMCPUAuditReviewEvidenceRecordHistoryPresentation=api;
})(typeof globalThis!=='undefined'?globalThis:this);
