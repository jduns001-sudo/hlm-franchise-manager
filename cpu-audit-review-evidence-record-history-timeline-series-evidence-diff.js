(function(root){
'use strict';
// Deterministic aggregate-only comparison of validated public timeline series evidence.
const evidence=(typeof module!=='undefined'&&module.exports)?require('./cpu-audit-review-evidence-record-history-timeline-series-evidence'):root.HFMCPUAuditReviewEvidenceRecordHistoryTimelineSeriesEvidence;
function compare(before,after){
 const a=evidence.validate(before),b=evidence.validate(after);
 const oldReasons=new Set(a.reasons),newReasons=new Set(b.reasons);
 return Object.freeze({
  kind:'cpu-audit-public-review-evidence-record-history-timeline-series-evidence-diff',
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
 return 'Aggregate review evidence record history timeline series comparison (read-only)\nSnapshot delta: '+d.snapshotCountDelta+'\nReview flag delta: '+d.reviewCountDelta+'\nReview requirement changed: '+d.reviewChanged;
}
const api=Object.freeze({compare,describe});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.HFMCPUAuditReviewEvidenceRecordHistoryTimelineSeriesEvidenceDiff=api;
})(typeof globalThis!=='undefined'?globalThis:this);
