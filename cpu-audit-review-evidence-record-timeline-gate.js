(function(root){
'use strict';
// Human-review advisory only. Never authorizes CPU or GM actions.
const bundles=(typeof module!=='undefined'&&module.exports)?require('./cpu-audit-review-evidence-record-timeline-bundle'):root.HFMCPUAuditReviewEvidenceRecordTimelineBundle;
function assess(input){
 const s=bundles.validate(input).summary;
 const reasons=[];
 if(s.count===0)reasons.push('No review evidence record timeline snapshots available');
 if(s.reviewCount>0)reasons.push('Human review flags occurred in evidence record timeline');
 if(s.reviewStateChanges>0)reasons.push('Human review requirement changed in evidence record timeline');
 return Object.freeze({kind:'cpu-audit-review-evidence-record-timeline-gate',readOnly:true,requiresHumanReview:reasons.length>0,reasons:Object.freeze(reasons),snapshotCount:s.count});
}
function describe(input){
 const gate=assess(input);
 return 'Aggregate review evidence record timeline gate (read-only): '+(gate.requiresHumanReview?'human review needed':'no timeline review flags')+'\n'+gate.reasons.join('\n');
}
const api=Object.freeze({assess,describe});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.HFMCPUAuditReviewEvidenceRecordTimelineGate=api;
})(typeof globalThis!=='undefined'?globalThis:this);
