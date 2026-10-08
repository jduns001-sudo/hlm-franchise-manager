(function(root){
'use strict';
// Public, aggregate-only trend bundle with deterministic validation.
const trends=(typeof module!=='undefined'&&module.exports)?require('./cpu-audit-review-trend-export'):root.HFMCPUAuditReviewTrendExport;
const presentation=(typeof module!=='undefined'&&module.exports)?require('./cpu-audit-review-trend-presentation'):root.HFMCPUAuditReviewTrendPresentation;
function build(items){
 const summary=trends.create(items);
 return Object.freeze({kind:'cpu-audit-public-review-trend-bundle',readOnly:true,summary,text:presentation.describe(summary)});
}
function validate(value){
 if(!value||typeof value!=='object'||Array.isArray(value)||value.kind!=='cpu-audit-public-review-trend-bundle'||value.readOnly!==true||typeof value.text!=='string')throw new TypeError('Invalid public review trend bundle');
 const summary=trends.validate(value.summary);
 if(value.text!==presentation.describe(summary))throw new TypeError('Public review trend text mismatch');
 return Object.freeze({kind:'cpu-audit-public-review-trend-bundle',readOnly:true,summary,text:value.text});
}
function stringify(value){return JSON.stringify(validate(value));}
function parse(text){if(typeof text!=='string'||text.length>1024)throw new TypeError('Invalid public review trend bundle JSON');return validate(JSON.parse(text));}
const api=Object.freeze({build,validate,stringify,parse});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.HFMCPUAuditReviewTrendBundle=api;
})(typeof globalThis!=='undefined'?globalThis:this);
