(function(root){
'use strict';
// Bounded read-only history of public aggregate review trend evidence.
const evidence=(typeof module!=='undefined'&&module.exports)?require('./cpu-audit-review-trend-evidence'):root.HFMCPUAuditReviewTrendEvidence;
const diffs=(typeof module!=='undefined'&&module.exports)?require('./cpu-audit-review-trend-evidence-diff'):root.HFMCPUAuditReviewTrendEvidenceDiff;
const MAX=20;
function summarize(items){
 if(!Array.isArray(items)||items.length>MAX)throw new TypeError('Review trend evidence timeline requires at most 20 snapshots');
 const entries=items.map(x=>evidence.validate(x)),transitions=[];
 for(let i=1;i<entries.length;i++)transitions.push(diffs.compare(entries[i-1],entries[i]));
 return Object.freeze({kind:'cpu-audit-public-review-trend-evidence-timeline',readOnly:true,count:entries.length,reviewCount:entries.filter(x=>x.requiresHumanReview).length,reviewStateChanges:transitions.filter(x=>x.reviewChanged).length,transitions:Object.freeze(transitions)});
}
function describe(items){
 const s=summarize(items);
 return 'Aggregate review trend evidence timeline (read-only)\nSnapshots: '+s.count+'\nHuman-review snapshots: '+s.reviewCount+'\nReview state changes: '+s.reviewStateChanges;
}
const api=Object.freeze({summarize,describe,MAX});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.HFMCPUAuditReviewTrendEvidenceTimeline=api;
})(typeof globalThis!=='undefined'?globalThis:this);
