(function(root){
'use strict';
// Read-only franchise audit comparison. No persistent storage or raw player data.
const fields=['teams','players','contracts','draftPicks','transactions','prospects'];
function compare(before,after){
 if(!before||!after||before.kind!=='cpu-audit-public-summary'||after.kind!=='cpu-audit-public-summary'||before.readOnly!==true||after.readOnly!==true)throw new TypeError('Aggregate audit summaries required');
 const changes={};for(const field of fields){const a=before.counts?.[field],b=after.counts?.[field];if(!Number.isSafeInteger(a)||a<0||!Number.isSafeInteger(b)||b<0)throw new TypeError('Invalid dataset count');changes[field]=b-a;}
 const issueDelta=after.issueCount-before.issueCount;if(!Number.isSafeInteger(issueDelta))throw new TypeError('Invalid issue count');
 return Object.freeze({kind:'cpu-audit-public-comparison',readOnly:true,changes:Object.freeze(changes),issueDelta,hasChanges:issueDelta!==0||Object.values(changes).some(x=>x!==0)});
}
function toCSV(comparison){if(!comparison||comparison.kind!=='cpu-audit-public-comparison'||comparison.readOnly!==true)throw new TypeError('Valid comparison required');return 'dataset,change\n'+fields.map(x=>x+','+comparison.changes[x]).join('\n')+'\nissues,'+comparison.issueDelta+'\n';}
const api=Object.freeze({compare,toCSV});if(typeof module!=='undefined'&&module.exports)module.exports=api;root.HFMCPUAuditPublicCompare=api;
})(typeof globalThis!=='undefined'?globalThis:this);
