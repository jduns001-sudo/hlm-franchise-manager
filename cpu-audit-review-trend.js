(function(root){
'use strict';
// Bounded public review-evidence trend, derived solely from validated aggregates.
const evidence=(typeof module!=='undefined'&&module.exports)?require('./cpu-audit-review-evidence'):root.HFMCPUAuditReviewEvidence;
const diffs=(typeof module!=='undefined'&&module.exports)?require('./cpu-audit-review-evidence-diff'):root.HFMCPUAuditReviewEvidenceDiff;
const MAX=20;
function summarize(items){
 if(!Array.isArray(items)||items.length>MAX)throw new TypeError('Review evidence trend requires at most 20 snapshots');
 const entries=items.map(x=>evidence.validate(x));
 const transitions=[];
 for(let i=1;i<entries.length;i++)transitions.push(diffs.compare(entries[i-1],entries[i]));
 const reviewCount=entries.filter(x=>x.requiresHumanReview).length;
 const opened=transitions.filter(x=>x.reviewChanged).length;
 return Object.freeze({kind:'cpu-audit-public-review-trend',readOnly:true,count:entries.length,reviewCount,reviewStateChanges:opened,transitions:Object.freeze(transitions)});
}
function describe(items){
 const s=summarize(items);
 return 'Aggregate review evidence trend (read-only)\nSnapshots: '+s.count+'\nHuman-review snapshots: '+s.reviewCount+'\nReview state changes: '+s.reviewStateChanges;
}
const api=Object.freeze({summarize,describe,MAX});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.HFMCPUAuditReviewTrend=api;
})(typeof globalThis!=='undefined'?globalThis:this);
