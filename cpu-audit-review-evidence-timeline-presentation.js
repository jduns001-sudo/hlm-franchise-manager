(function(root){
'use strict';
// Deterministic presentation of validated aggregate review evidence counts.
const exports=(typeof module!=='undefined'&&module.exports)?require('./cpu-audit-review-evidence-timeline-export'):root.HFMCPUAuditReviewEvidenceTimelineExport;
function lines(input){
 const s=exports.validate(input);
 return Object.freeze([
  'Aggregate review evidence timeline (read-only)',
  'Snapshots: '+s.count,
  'Human-review snapshots: '+s.reviewCount,
  'Review state changes: '+s.reviewStateChanges,
  'Transitions: '+s.transitionCount
 ]);
}
function describe(input){return lines(input).join('\n');}
const api=Object.freeze({lines,describe});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.HFMCPUAuditReviewEvidenceTimelinePresentation=api;
})(typeof globalThis!=='undefined'?globalThis:this);
