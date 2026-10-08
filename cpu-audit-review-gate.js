(function(root){
'use strict';
// Advisory-only review gate. Never authorizes transactions or mutates saves.
const bundles=(typeof module!=='undefined'&&module.exports)?require('./cpu-audit-summary-bundle'):root.HFMCPUAuditSummaryBundle;
function assess(input){
 const b=bundles.validate(input),s=b.summary;
 const reasons=[];
 if(s.reportCount===0)reasons.push('No advisory reports available');
 if(s.reviewCount>0)reasons.push('Advisory history contains review flags');
 if(s.latestReviewRequired===true)reasons.push('Latest advisory requires review');
 return Object.freeze({kind:'cpu-audit-review-gate',readOnly:true,requiresHumanReview:reasons.length>0,reasons:Object.freeze(reasons),reportCount:s.reportCount});
}
function describe(input){
 const v=assess(input);
 return 'Aggregate advisory review: '+(v.requiresHumanReview?'human review needed':'no advisory flags')+'\n'+v.reasons.join('\n');
}
const api=Object.freeze({assess,describe});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.HFMCPUAuditReviewGate=api;
})(typeof globalThis!=='undefined'?globalThis:this);
