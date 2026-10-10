(function(root){
'use strict';
// Validated aggregate-only export for bounded review evidence record history timeline series.
const series=(typeof module!=='undefined'&&module.exports)?require('./cpu-audit-review-evidence-record-history-timeline-series'):root.HFMCPUAuditReviewEvidenceRecordHistoryTimelineSeries;
const KIND='cpu-audit-public-review-evidence-record-history-timeline-series-summary';
function create(items){
 const s=series.summarize(items);
 return Object.freeze({kind:KIND,readOnly:true,count:s.count,reviewCount:s.reviewCount,reviewStateChanges:s.reviewStateChanges,transitionCount:s.transitions.length});
}
function validate(value){
 if(!value||typeof value!=='object'||Array.isArray(value)||value.kind!==KIND||value.readOnly!==true)throw new TypeError('Invalid review evidence record history timeline series summary');
 const {count,reviewCount,reviewStateChanges,transitionCount}=value;
 if(!Number.isSafeInteger(count)||count<0||count>series.MAX||!Number.isSafeInteger(reviewCount)||reviewCount<0||reviewCount>count||!Number.isSafeInteger(transitionCount)||transitionCount!==Math.max(0,count-1)||!Number.isSafeInteger(reviewStateChanges)||reviewStateChanges<0||reviewStateChanges>transitionCount)throw new TypeError('Invalid review evidence record history timeline series counts');
 return Object.freeze({kind:KIND,readOnly:true,count,reviewCount,reviewStateChanges,transitionCount});
}
function stringify(value){return JSON.stringify(validate(value));}
function parse(value){if(typeof value!=='string'||value.length>512)throw new TypeError('Invalid review evidence record history timeline series JSON');return validate(JSON.parse(value));}
const api=Object.freeze({create,validate,stringify,parse});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.HFMCPUAuditReviewEvidenceRecordHistoryTimelineSeriesExport=api;
})(typeof globalThis!=='undefined'?globalThis:this);
