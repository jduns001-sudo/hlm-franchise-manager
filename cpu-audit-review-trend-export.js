(function(root){
'use strict';
// Export only validated bounded review trend counts, never raw snapshots.
const trends=(typeof module!=='undefined'&&module.exports)?require('./cpu-audit-review-trend'):root.HFMCPUAuditReviewTrend;
function create(items){
 const s=trends.summarize(items);
 return Object.freeze({kind:'cpu-audit-public-review-trend-summary',readOnly:true,count:s.count,reviewCount:s.reviewCount,reviewStateChanges:s.reviewStateChanges,transitionCount:s.transitions.length});
}
function validate(v){
 if(!v||typeof v!=='object'||Array.isArray(v)||v.kind!=='cpu-audit-public-review-trend-summary'||v.readOnly!==true)throw new TypeError('Invalid public review trend summary');
 const {count,reviewCount,reviewStateChanges,transitionCount}=v;
 if(!Number.isSafeInteger(count)||count<0||count>20||!Number.isSafeInteger(reviewCount)||reviewCount<0||reviewCount>count||transitionCount!==Math.max(0,count-1)||!Number.isSafeInteger(reviewStateChanges)||reviewStateChanges<0||reviewStateChanges>transitionCount)throw new TypeError('Invalid review trend counts');
 if(count===0&&(reviewCount!==0||reviewStateChanges!==0))throw new TypeError('Empty trend must have zero counts');
 return Object.freeze({kind:'cpu-audit-public-review-trend-summary',readOnly:true,count,reviewCount,reviewStateChanges,transitionCount});
}
function stringify(value){return JSON.stringify(validate(value));}
function parse(value){if(typeof value!=='string'||value.length>512)throw new TypeError('Invalid review trend JSON');return validate(JSON.parse(value));}
const api=Object.freeze({create,validate,stringify,parse});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.HFMCPUAuditReviewTrendExport=api;
})(typeof globalThis!=='undefined'?globalThis:this);
