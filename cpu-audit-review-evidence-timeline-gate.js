(function(root){
'use strict';
// Advisory-only gate for validated aggregate review evidence timeline bundles.
const bundles=(typeof module!=='undefined'&&module.exports)?require('./cpu-audit-review-evidence-timeline-bundle'):root.HFMCPUAuditReviewEvidenceTimelineBundle;
function assess(input){
 const s=bundles.validate(input).summary;
 const reasons=[];
 if(s.count===0)reasons.push('No review evidence timeline snapshots available');
 if(s.reviewCount>0)reasons.push('Human review flags occurred in evidence timeline');
 if(s.reviewStateChanges>0)reasons.push('Human review requirement changed in evidence timeline');
 return Object.freeze({kind:'cpu-audit-review-evidence-timeline-gate',readOnly:true,requiresHumanReview:reasons.length>0,reasons:Object.freeze(reasons),snapshotCount:s.count});
}
function describe(input){
 const gate=assess(input);
 return 'Aggregate review evidence timeline gate (read-only): '+(gate.requiresHumanReview?'human review needed':'no timeline review flags')+'\n'+gate.reasons.join('\n');
}
const api=Object.freeze({assess,describe});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.HFMCPUAuditReviewEvidenceTimelineGate=api;
})(typeof globalThis!=='undefined'?globalThis:this);
