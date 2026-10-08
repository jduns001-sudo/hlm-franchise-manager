(function(root){
'use strict';
// Export only bounded aggregate review-evidence timeline counts.
const timelines=(typeof module!=='undefined'&&module.exports)?require('./cpu-audit-review-trend-evidence-timeline'):root.HFMCPUAuditReviewTrendEvidenceTimeline;
function create(items){
 const s=timelines.summarize(items);
 return Object.freeze({kind:'cpu-audit-public-review-evidence-timeline-summary',readOnly:true,count:s.count,reviewCount:s.reviewCount,reviewStateChanges:s.reviewStateChanges,transitionCount:s.transitions.length});
}
function validate(value){
 if(!value||typeof value!=='object'||Array.isArray(value)||value.kind!=='cpu-audit-public-review-evidence-timeline-summary'||value.readOnly!==true)throw new TypeError('Invalid public review evidence timeline summary');
 const {count,reviewCount,reviewStateChanges,transitionCount}=value;
 if(!Number.isSafeInteger(count)||count<0||count>timelines.MAX||!Number.isSafeInteger(reviewCount)||reviewCount<0||reviewCount>count||!Number.isSafeInteger(transitionCount)||transitionCount!==Math.max(0,count-1)||!Number.isSafeInteger(reviewStateChanges)||reviewStateChanges<0||reviewStateChanges>transitionCount)throw new TypeError('Invalid review evidence timeline counts');
 return Object.freeze({kind:'cpu-audit-public-review-evidence-timeline-summary',readOnly:true,count,reviewCount,reviewStateChanges,transitionCount});
}
function stringify(value){return JSON.stringify(validate(value));}
function parse(value){if(typeof value!=='string'||value.length>512)throw new TypeError('Invalid review evidence timeline JSON');return validate(JSON.parse(value));}
const api=Object.freeze({create,validate,stringify,parse});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.HFMCPUAuditReviewEvidenceTimelineExport=api;
})(typeof globalThis!=='undefined'?globalThis:this);
