(function(root){
'use strict';
// Portable aggregate advisory report. Never contains franchise identifiers or player data.
const advisory=(typeof module!=='undefined'&&module.exports)?require('./cpu-audit-trend-advisory'):root.HFMCPUAuditTrendAdvisory;
const warningSet=['Data issue count increased','Team count decreased','Player count decreased','Draft pick count decreased'];
function create(comparison){
 const a=advisory.assess(comparison);
 return Object.freeze({kind:'cpu-audit-public-advisory',readOnly:true,requiresReview:a.requiresReview,issueTrend:a.issueTrend,changed:a.changed,warnings:Object.freeze([...a.warnings])});
}
function validate(input){
 if(!input||typeof input!=='object'||Array.isArray(input)||input.kind!=='cpu-audit-public-advisory'||input.readOnly!==true||typeof input.requiresReview!=='boolean'||typeof input.changed!=='boolean'||!['increased','decreased','unchanged'].includes(input.issueTrend)||!Array.isArray(input.warnings)||input.warnings.length>warningSet.length)throw new TypeError('Invalid aggregate advisory');
 if(input.warnings.some((w,i)=>!warningSet.includes(w)||input.warnings.indexOf(w)!==i)||input.requiresReview!==(input.warnings.length>0))throw new TypeError('Invalid advisory warnings');
 return Object.freeze({kind:'cpu-audit-public-advisory',readOnly:true,requiresReview:input.requiresReview,changed:input.changed,issueTrend:input.issueTrend,warnings:Object.freeze([...input.warnings])});
}
function stringify(input){return JSON.stringify(validate(input));}
function parse(text){if(typeof text!=='string'||text.length>2048)throw new TypeError('Invalid advisory JSON size');return validate(JSON.parse(text));}
const api=Object.freeze({create,validate,stringify,parse});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.HFMCPUAuditAdvisoryReport=api;
})(typeof globalThis!=='undefined'?globalThis:this);
