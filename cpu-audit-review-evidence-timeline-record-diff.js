(function(root){
'use strict';
// Deterministic comparison of validated public aggregate review evidence records.
const records=(typeof module!=='undefined'&&module.exports)?require('./cpu-audit-review-evidence-timeline-record'):root.HFMCPUAuditReviewEvidenceTimelineRecord;
function compare(before,after){
 const a=records.validate(before),b=records.validate(after);
 const oldReasons=new Set(a.reasons),newReasons=new Set(b.reasons);
 return Object.freeze({
  kind:'cpu-audit-public-review-evidence-timeline-record-diff',
  readOnly:true,
  reviewChanged:a.requiresHumanReview!==b.requiresHumanReview,
  snapshotCountDelta:b.summary.count-a.summary.count,
  reviewCountDelta:b.summary.reviewCount-a.summary.reviewCount,
  reviewStateChangesDelta:b.summary.reviewStateChanges-a.summary.reviewStateChanges,
  addedReasons:Object.freeze(b.reasons.filter(reason=>!oldReasons.has(reason))),
  resolvedReasons:Object.freeze(a.reasons.filter(reason=>!newReasons.has(reason)))
 });
}
function describe(before,after){
 const d=compare(before,after);
 return 'Aggregate review evidence timeline record comparison (read-only)\nSnapshot delta: '+d.snapshotCountDelta+'\nReview flag delta: '+d.reviewCountDelta+'\nReview requirement changed: '+d.reviewChanged;
}
const api=Object.freeze({compare,describe});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.HFMCPUAuditReviewEvidenceTimelineRecordDiff=api;
})(typeof globalThis!=='undefined'?globalThis:this);
