(function(root){
'use strict';
// Advisory human-review gate for validated public aggregate history timeline only.
const bundles=(typeof module!=='undefined'&&module.exports)?require('./cpu-audit-review-evidence-record-history-timeline-bundle'):root.HFMCPUAuditReviewEvidenceRecordHistoryTimelineBundle;
function assess(input){
 const s=bundles.validate(input).summary;
 const reasons=[];
 if(s.count===0)reasons.push('No review evidence record history timeline snapshots available');
 if(s.reviewCount>0)reasons.push('Human review flags occurred in evidence record history timeline');
 if(s.reviewStateChanges>0)reasons.push('Human review requirement changed in evidence record history timeline');
 return Object.freeze({kind:'cpu-audit-review-evidence-record-history-timeline-gate',readOnly:true,requiresHumanReview:reasons.length>0,reasons:Object.freeze(reasons),snapshotCount:s.count});
}
function describe(input){
 const gate=assess(input);
 return 'Aggregate review evidence record history timeline gate (read-only): '+(gate.requiresHumanReview?'human review needed':'no history review flags')+'\n'+gate.reasons.join('\n');
}
const api=Object.freeze({assess,describe});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.HFMCPUAuditReviewEvidenceRecordHistoryTimelineGate=api;
})(typeof globalThis!=='undefined'?globalThis:this);
