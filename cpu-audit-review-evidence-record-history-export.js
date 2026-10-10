(function(root){
'use strict';
// Public aggregate-only export of bounded review evidence record history.
const histories=(typeof module!=='undefined'&&module.exports)?require('./cpu-audit-review-evidence-record-history'):root.HFMCPUAuditReviewEvidenceRecordHistory;
function create(items){
 const s=histories.summarize(items);
 return Object.freeze({kind:'cpu-audit-public-review-evidence-record-history-summary',readOnly:true,count:s.count,reviewCount:s.reviewCount,reviewStateChanges:s.reviewStateChanges,transitionCount:s.transitions.length});
}
function validate(value){
 if(!value||typeof value!=='object'||Array.isArray(value)||value.kind!=='cpu-audit-public-review-evidence-record-history-summary'||value.readOnly!==true)throw new TypeError('Invalid review evidence record history summary');
 const {count,reviewCount,reviewStateChanges,transitionCount}=value;
 if(!Number.isSafeInteger(count)||count<0||count>histories.MAX||!Number.isSafeInteger(reviewCount)||reviewCount<0||reviewCount>count||!Number.isSafeInteger(transitionCount)||transitionCount!==Math.max(0,count-1)||!Number.isSafeInteger(reviewStateChanges)||reviewStateChanges<0||reviewStateChanges>transitionCount)throw new TypeError('Invalid review evidence record history counts');
 return Object.freeze({kind:'cpu-audit-public-review-evidence-record-history-summary',readOnly:true,count,reviewCount,reviewStateChanges,transitionCount});
}
function stringify(value){return JSON.stringify(validate(value));}
function parse(value){if(typeof value!=='string'||value.length>512)throw new TypeError('Invalid review evidence record history JSON');return validate(JSON.parse(value));}
const api=Object.freeze({create,validate,stringify,parse});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.HFMCPUAuditReviewEvidenceRecordHistoryExport=api;
})(typeof globalThis!=='undefined'?globalThis:this);
