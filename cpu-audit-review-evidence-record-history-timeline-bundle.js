(function(root){
'use strict';
// Validated public aggregate history timeline bundle. No private player or team data.
const exports=(typeof module!=='undefined'&&module.exports)?require('./cpu-audit-review-evidence-record-history-timeline-export'):root.HFMCPUAuditReviewEvidenceRecordHistoryTimelineExport;
const presentation=(typeof module!=='undefined'&&module.exports)?require('./cpu-audit-review-evidence-record-history-timeline-presentation'):root.HFMCPUAuditReviewEvidenceRecordHistoryTimelinePresentation;
function build(items){
 const summary=exports.create(items);
 return Object.freeze({kind:'cpu-audit-public-review-evidence-record-history-timeline-bundle',readOnly:true,summary,text:presentation.describe(summary)});
}
function validate(value){
 if(!value||typeof value!=='object'||Array.isArray(value)||value.kind!=='cpu-audit-public-review-evidence-record-history-timeline-bundle'||value.readOnly!==true||typeof value.text!=='string')throw new TypeError('Invalid review evidence record history timeline bundle');
 const summary=exports.validate(value.summary),text=presentation.describe(summary);
 if(value.text!==text)throw new TypeError('Review evidence record history timeline bundle presentation mismatch');
 return Object.freeze({kind:'cpu-audit-public-review-evidence-record-history-timeline-bundle',readOnly:true,summary,text});
}
function stringify(value){return JSON.stringify(validate(value));}
function parse(value){if(typeof value!=='string'||value.length>1024)throw new TypeError('Invalid review evidence record history timeline bundle JSON');return validate(JSON.parse(value));}
const api=Object.freeze({build,validate,stringify,parse});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.HFMCPUAuditReviewEvidenceRecordHistoryTimelineBundle=api;
})(typeof globalThis!=='undefined'?globalThis:this);
