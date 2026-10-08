(function(root){
'use strict';
// Validated public aggregate timeline bundle, no private franchise data.
const exports=(typeof module!=='undefined'&&module.exports)?require('./cpu-audit-review-evidence-timeline-export'):root.HFMCPUAuditReviewEvidenceTimelineExport;
const presentation=(typeof module!=='undefined'&&module.exports)?require('./cpu-audit-review-evidence-timeline-presentation'):root.HFMCPUAuditReviewEvidenceTimelinePresentation;
function build(items){
 const summary=exports.create(items);
 return Object.freeze({kind:'cpu-audit-public-review-evidence-timeline-bundle',readOnly:true,summary,text:presentation.describe(summary)});
}
function validate(value){
 if(!value||typeof value!=='object'||Array.isArray(value)||value.kind!=='cpu-audit-public-review-evidence-timeline-bundle'||value.readOnly!==true||typeof value.text!=='string')throw new TypeError('Invalid review evidence timeline bundle');
 const summary=exports.validate(value.summary),text=presentation.describe(summary);
 if(value.text!==text)throw new TypeError('Review evidence timeline bundle presentation mismatch');
 return Object.freeze({kind:'cpu-audit-public-review-evidence-timeline-bundle',readOnly:true,summary,text});
}
function stringify(value){return JSON.stringify(validate(value));}
function parse(value){if(typeof value!=='string'||value.length>1024)throw new TypeError('Invalid review evidence timeline bundle JSON');return validate(JSON.parse(value));}
const api=Object.freeze({build,validate,stringify,parse});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.HFMCPUAuditReviewEvidenceTimelineBundle=api;
})(typeof globalThis!=='undefined'?globalThis:this);
