(function(root){
'use strict';
// Export aggregate-only timeline statistics. No raw franchise state or identifiers.
const timeline=(typeof module!=='undefined'&&module.exports)?require('./cpu-audit-advisory-timeline'):root.HFMCPUAuditAdvisoryTimeline;
function create(items){
 const s=timeline.summarize(items);
 return Object.freeze({kind:'cpu-audit-public-timeline-summary',readOnly:true,reportCount:s.count,reviewCount:s.reviewCount,transitionCount:s.transitions.length,latestReviewRequired:s.latest?s.latest.requiresReview:null});
}
function validate(input){
 if(!input||typeof input!=='object'||Array.isArray(input)||input.kind!=='cpu-audit-public-timeline-summary'||input.readOnly!==true)throw new TypeError('Invalid public timeline summary');
 const {reportCount,reviewCount,transitionCount,latestReviewRequired}=input;
 if(!Number.isSafeInteger(reportCount)||reportCount<0||reportCount>20||!Number.isSafeInteger(reviewCount)||reviewCount<0||reviewCount>reportCount||transitionCount!==Math.max(0,reportCount-1)||!(typeof latestReviewRequired==='boolean'||latestReviewRequired===null)||((reportCount===0)!==(latestReviewRequired===null)))throw new TypeError('Invalid timeline summary counts');
 return Object.freeze({kind:'cpu-audit-public-timeline-summary',readOnly:true,reportCount,reviewCount,transitionCount,latestReviewRequired});
}
function stringify(input){return JSON.stringify(validate(input));}
function parse(input){if(typeof input!=='string'||input.length>512)throw new TypeError('Invalid timeline summary JSON size');return validate(JSON.parse(input));}
const api=Object.freeze({create,validate,stringify,parse});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.HFMCPUAuditTimelineExport=api;
})(typeof globalThis!=='undefined'?globalThis:this);
