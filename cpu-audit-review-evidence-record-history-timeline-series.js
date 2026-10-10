(function(root){
'use strict';
// Bounded aggregate-only history of validated review evidence record history timeline evidence.
const evidence=(typeof module!=='undefined'&&module.exports)?require('./cpu-audit-review-evidence-record-history-timeline-evidence'):root.HFMCPUAuditReviewEvidenceRecordHistoryTimelineEvidence;
const diffs=(typeof module!=='undefined'&&module.exports)?require('./cpu-audit-review-evidence-record-history-timeline-evidence-diff'):root.HFMCPUAuditReviewEvidenceRecordHistoryTimelineEvidenceDiff;
const MAX=20;
function summarize(items){
 if(!Array.isArray(items)||items.length>MAX)throw new TypeError('Review evidence record history timeline series requires at most 20 snapshots');
 const entries=items.map(x=>evidence.validate(x)),transitions=[];
 for(let i=1;i<entries.length;i++)transitions.push(diffs.compare(entries[i-1],entries[i]));
 return Object.freeze({kind:'cpu-audit-public-review-evidence-record-history-timeline-series',readOnly:true,count:entries.length,reviewCount:entries.filter(x=>x.requiresHumanReview).length,reviewStateChanges:transitions.filter(x=>x.reviewChanged).length,transitions:Object.freeze(transitions)});
}
function describe(items){
 const s=summarize(items);
 return 'Aggregate review evidence record history timeline series (read-only)\nSnapshots: '+s.count+'\nHuman-review snapshots: '+s.reviewCount+'\nReview state changes: '+s.reviewStateChanges;
}
const api=Object.freeze({summarize,describe,MAX});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.HFMCPUAuditReviewEvidenceRecordHistoryTimelineSeries=api;
})(typeof globalThis!=='undefined'?globalThis:this);
