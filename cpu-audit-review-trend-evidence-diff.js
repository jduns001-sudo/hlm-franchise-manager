(function(root){
'use strict';
// Compare public aggregate review trend evidence only, without private records.
const evidence=(typeof module!=='undefined'&&module.exports)?require('./cpu-audit-review-trend-evidence'):root.HFMCPUAuditReviewTrendEvidence;
function compare(before,after){
 const a=evidence.validate(before),b=evidence.validate(after);
 const aReasons=new Set(a.reasons),bReasons=new Set(b.reasons);
 return Object.freeze({
  kind:'cpu-audit-public-review-trend-evidence-diff',
  readOnly:true,
  reviewChanged:a.requiresHumanReview!==b.requiresHumanReview,
  snapshotCountDelta:b.summary.count-a.summary.count,
  reviewCountDelta:b.summary.reviewCount-a.summary.reviewCount,
  reviewStateChangesDelta:b.summary.reviewStateChanges-a.summary.reviewStateChanges,
  addedReasons:Object.freeze(b.reasons.filter(x=>!aReasons.has(x))),
  resolvedReasons:Object.freeze(a.reasons.filter(x=>!bReasons.has(x)))
 });
}
function describe(before,after){
 const v=compare(before,after);
 return 'Aggregate review trend evidence comparison (read-only)\nSnapshots delta: '+v.snapshotCountDelta+'\nReview flags delta: '+v.reviewCountDelta+'\nReview state changes delta: '+v.reviewStateChangesDelta+'\nHuman review changed: '+v.reviewChanged;
}
const api=Object.freeze({compare,describe});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.HFMCPUAuditReviewTrendEvidenceDiff=api;
})(typeof globalThis!=='undefined'?globalThis:this);
