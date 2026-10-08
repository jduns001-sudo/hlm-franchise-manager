(function(root){
'use strict';
// Aggregate-only diagnostics. Does not read individual players or mutate saves.
const integrity=(typeof module!=='undefined'&&module.exports)?require('./cpu-audit-integrity'):root.HFMCPUAuditIntegrity;
const fields=['teams','players','contracts','draftPicks','transactions','prospects'];
function analyze(value){
 const v=integrity.validateComparison(value);
 const increased=fields.filter(k=>v.changes[k]>0);
 const decreased=fields.filter(k=>v.changes[k]<0);
 const unchanged=fields.filter(k=>v.changes[k]===0);
 const issueTrend=v.issueDelta>0?'increased':v.issueDelta<0?'decreased':'unchanged';
 const result={kind:'cpu-audit-comparison-diagnostics',readOnly:true,changed:v.hasChanges,increased:Object.freeze(increased),decreased:Object.freeze(decreased),unchanged:Object.freeze(unchanged),issueTrend,issueDelta:v.issueDelta};
 return Object.freeze(result);
}
function describe(value){
 const d=analyze(value);
 return ['Aggregate audit diagnostics (read-only)','Increased datasets: '+(d.increased.join(', ')||'none'),'Decreased datasets: '+(d.decreased.join(', ')||'none'),'Unchanged datasets: '+(d.unchanged.join(', ')||'none'),'Data issues: '+d.issueTrend+' ('+(d.issueDelta>0?'+':'')+d.issueDelta+')'].join('\n');
}
const api=Object.freeze({analyze,describe});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.HFMCPUAuditComparisonDiagnostics=api;
})(typeof globalThis!=='undefined'?globalThis:this);
