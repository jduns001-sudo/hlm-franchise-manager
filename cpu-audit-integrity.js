(function(root){
'use strict';
// Validate aggregate-only comparison files before displaying them. No state writes.
const fields=['teams','players','contracts','draftPicks','transactions','prospects'];
function validateComparison(value){
 if(!value||typeof value!=='object'||Array.isArray(value)||value.kind!=='cpu-audit-public-comparison'||value.readOnly!==true||!value.changes||typeof value.changes!=='object')throw new TypeError('Invalid aggregate comparison');
 const changes={};for(const field of fields){const n=value.changes[field];if(!Number.isSafeInteger(n))throw new TypeError('Invalid delta: '+field);changes[field]=n;}
 if(!Number.isSafeInteger(value.issueDelta))throw new TypeError('Invalid issue delta');
 const hasChanges=value.issueDelta!==0||Object.values(changes).some(n=>n!==0);
 return Object.freeze({kind:'cpu-audit-public-comparison',readOnly:true,changes:Object.freeze(changes),issueDelta:value.issueDelta,hasChanges});
}
function parseJSON(text){if(typeof text!=='string'||text.length>100000)throw new TypeError('Comparison JSON must be at most 100 KB');return validateComparison(JSON.parse(text));}
function describe(value){const v=validateComparison(value);return ['Aggregate franchise comparison (read-only)',...fields.map(f=>f+': '+(v.changes[f]>0?'+':'')+v.changes[f]),'Data issue change: '+(v.issueDelta>0?'+':'')+v.issueDelta].join('\n');}
const api=Object.freeze({validateComparison,parseJSON,describe});if(typeof module!=='undefined'&&module.exports)module.exports=api;root.HFMCPUAuditIntegrity=api;
})(typeof globalThis!=='undefined'?globalThis:this);
