(function(root){
'use strict';
// Advisory human-review gate for validated public aggregate history only.
const bundles=(typeof module!=='undefined'&&module.exports)?require('./cpu-audit-review-evidence-record-history-bundle'):root.HFMCPUAuditReviewEvidenceRecordHistoryBundle;
function assess(input){
 const s=bundles.validate(input).summary;
 const reasons=[];
 if(s.count===0)reasons.push('No review evidence record history snapshots available');
 if(s.reviewCount>0)reasons.push('Human review flags occurred in evidence record history');
 if(s.reviewStateChanges>0)reasons.push('Human review requirement changed in evidence record history');
 return Object.freeze({kind:'cpu-audit-review-evidence-record-history-gate',readOnly:true,requiresHumanReview:reasons.length>0,reasons:Object.freeze(reasons),snapshotCount:s.count});
}
function describe(input){
 const gate=assess(input);
 return 'Aggregate review evidence record history gate (read-only): '+(gate.requiresHumanReview?'human review needed':'no history review flags')+'\n'+gate.reasons.join('\n');
}
const api=Object.freeze({assess,describe});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.HFMCPUAuditReviewEvidenceRecordHistoryGate=api;
})(typeof globalThis!=='undefined'?globalThis:this);
