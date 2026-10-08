(function(root){
'use strict';
// Read-only audit privacy: exports contain aggregate counts and warnings, never raw roster data.
const KEYS=['teams','players','contracts','draftPicks','transactions','prospects'];
function safeSummary(summary){
 if(!summary||summary.kind!=='cpu-audit-summary'||summary.readOnly!==true||!summary.counts||!Array.isArray(summary.issues))throw new TypeError('Valid audit summary required');
 const counts={};for(const key of KEYS){const value=summary.counts[key];if(!Number.isSafeInteger(value)||value<0)throw new TypeError('Invalid count: '+key);counts[key]=value;}
 return Object.freeze({kind:'cpu-audit-public-summary',readOnly:true,counts:Object.freeze(counts),issueCount:summary.issueCount,hasWarnings:summary.issueCount>0});
}
function toJSON(summary){return JSON.stringify(safeSummary(summary),null,2);}
function toCSV(summary){const s=safeSummary(summary);return 'dataset,count\n'+KEYS.map(key=>key+','+s.counts[key]).join('\n')+'\n';}
const api=Object.freeze({safeSummary,toJSON,toCSV});if(typeof module!=='undefined'&&module.exports)module.exports=api;root.HFMCPUAuditPrivacy=api;
})(typeof globalThis!=='undefined'?globalThis:this);
