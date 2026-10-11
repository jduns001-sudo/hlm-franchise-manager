(function(root){
'use strict';
// Advisory human-review gate for validated aggregate-only history timeline series.
const bundles=(typeof module!=='undefined'&&module.exports)?require('./cpu-audit-review-evidence-record-history-timeline-series-bundle'):root.HFMCPUAuditReviewEvidenceRecordHistoryTimelineSeriesBundle;
function assess(input){
 const s=bundles.validate(input).summary;
 const reasons=[];
 if(s.count===0)reasons.push('No review evidence record history timeline series snapshots available');
 if(s.reviewCount>0)reasons.push('Human review flags occurred in evidence record history timeline series');
 if(s.reviewStateChanges>0)reasons.push('Human review requirement changed in evidence record history timeline series');
 return Object.freeze({kind:'cpu-audit-review-evidence-record-history-timeline-series-gate',readOnly:true,requiresHumanReview:reasons.length>0,reasons:Object.freeze(reasons),snapshotCount:s.count});
}
function describe(input){
 const gate=assess(input);
 return 'Aggregate review evidence record history timeline series gate (read-only): '+(gate.requiresHumanReview?'human review needed':'no history review flags')+'\n'+gate.reasons.join('\n');
}
const api=Object.freeze({assess,describe});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.HFMCPUAuditReviewEvidenceRecordHistoryTimelineSeriesGate=api;
})(typeof globalThis!=='undefined'?globalThis:this);
