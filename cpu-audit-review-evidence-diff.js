(function(root){
'use strict';
// Compare two validated public review evidence snapshots without exposing save data.
const evidence=(typeof module!=='undefined'&&module.exports)?require('./cpu-audit-review-evidence'):root.HFMCPUAuditReviewEvidence;
function compare(before,after){
 const a=evidence.validate(before),b=evidence.validate(after);
 const added=b.reasons.filter(x=>!a.reasons.includes(x));
 const resolved=a.reasons.filter(x=>!b.reasons.includes(x));
 return Object.freeze({kind:'cpu-audit-public-review-evidence-diff',readOnly:true,reviewChanged:a.requiresHumanReview!==b.requiresHumanReview,reportCountDelta:b.summary.reportCount-a.summary.reportCount,addedReasons:Object.freeze(added),resolvedReasons:Object.freeze(resolved)});
}
function describe(before,after){
 const d=compare(before,after);
 return 'Aggregate review evidence changes (read-only)\nReport count change: '+d.reportCountDelta+'\nNew review reasons: '+d.addedReasons.length+'\nResolved review reasons: '+d.resolvedReasons.length;
}
const api=Object.freeze({compare,describe});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.HFMCPUAuditReviewEvidenceDiff=api;
})(typeof globalThis!=='undefined'?globalThis:this);
