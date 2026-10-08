(function(root){
'use strict';
// Pure, advisory-only gate derived from validated aggregate review trends.
const bundles=(typeof module!=='undefined'&&module.exports)?require('./cpu-audit-review-trend-bundle'):root.HFMCPUAuditReviewTrendBundle;
function assess(input){
 const s=bundles.validate(input).summary;
 const reasons=[];
 if(s.count===0)reasons.push('No review trend snapshots available');
 if(s.reviewCount>0)reasons.push('Review flags occurred in trend');
 if(s.reviewStateChanges>0)reasons.push('Review requirement changed in trend');
 return Object.freeze({kind:'cpu-audit-review-trend-gate',readOnly:true,requiresHumanReview:reasons.length>0,reasons:Object.freeze(reasons),snapshotCount:s.count});
}
function describe(input){
 const result=assess(input);
 return 'Aggregate review trend gate (read-only): '+(result.requiresHumanReview?'human review needed':'no trend review flags')+'\n'+result.reasons.join('\n');
}
const api=Object.freeze({assess,describe});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.HFMCPUAuditReviewTrendGate=api;
})(typeof globalThis!=='undefined'?globalThis:this);
