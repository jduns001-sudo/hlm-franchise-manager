(function(root){
'use strict';
// Bounded aggregate-only history of validated public timeline series evidence.
const evidence=(typeof module!=='undefined'&&module.exports)?require('./cpu-audit-review-evidence-record-history-timeline-series-evidence'):root.HFMCPUAuditReviewEvidenceRecordHistoryTimelineSeriesEvidence;
const diffs=(typeof module!=='undefined'&&module.exports)?require('./cpu-audit-review-evidence-record-history-timeline-series-evidence-diff'):root.HFMCPUAuditReviewEvidenceRecordHistoryTimelineSeriesEvidenceDiff;
const MAX=20;
function summarize(items){
 if(!Array.isArray(items)||items.length>MAX)throw new TypeError('Review evidence record history timeline series history requires at most 20 snapshots');
 const entries=items.map(x=>evidence.validate(x)),transitions=[];
 for(let i=1;i<entries.length;i++)transitions.push(diffs.compare(entries[i-1],entries[i]));
 return Object.freeze({kind:'cpu-audit-public-review-evidence-record-history-timeline-series-history',readOnly:true,count:entries.length,reviewCount:entries.filter(x=>x.requiresHumanReview).length,reviewStateChanges:transitions.filter(x=>x.reviewChanged).length,transitions:Object.freeze(transitions)});
}
function describe(items){
 const s=summarize(items);
 return 'Aggregate review evidence record history timeline series history (read-only)\nSnapshots: '+s.count+'\nHuman-review snapshots: '+s.reviewCount+'\nReview state changes: '+s.reviewStateChanges;
}
const api=Object.freeze({summarize,describe,MAX});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.HFMCPUAuditReviewEvidenceRecordHistoryTimelineSeriesHistory=api;
})(typeof globalThis!=='undefined'?globalThis:this);
