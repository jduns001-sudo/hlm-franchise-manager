(function(root){
'use strict';
// Safe text-only audit presentation, no HTML injection or save mutation.
const fields=['teams','players','contracts','draftPicks','transactions','prospects'];
function format(result,hasPrevious){
 if(!result||result.kind!=='cpu-audit-pipeline'||result.readOnly!==true)throw new TypeError('Read-only audit pipeline result required');
 if(!result.found)return 'No local franchise snapshot found. Nothing was changed.';
 const summary=result.summary;if(!summary||!summary.counts||!Array.isArray(summary.issues))throw new TypeError('Invalid audit summary');
 const lines=['Franchise audit (read-only)','Controlled team: '+(summary.controlledTeamId??'not identified'),'','Dataset counts:'];
 for(const field of fields)lines.push('  '+field+': '+summary.counts[field]);
 lines.push('','Data warnings ('+summary.issueCount+'):');
 if(!summary.issues.length)lines.push('  None');else for(const warning of summary.issues)lines.push('  - '+warning);
 if(hasPrevious){lines.push('','Changes since previous audit:');for(const field of fields){const delta=result.trend.delta[field];if(delta!==0)lines.push('  '+field+': '+(delta>0?'+':'')+delta);}if(fields.every(field=>result.trend.delta[field]===0))lines.push('  No dataset count changes');lines.push('','Advisory alerts ('+result.alerts.count+'):');if(!result.alerts.count)lines.push('  None');else for(const alert of result.alerts.alerts)lines.push('  - '+alert.message);}
 else lines.push('','Run the audit again after franchise data changes to see comparisons.');
 return lines.join('\n');
}
const api=Object.freeze({format});if(typeof module!=='undefined'&&module.exports)module.exports=api;root.HFMCPUAuditPresentation=api;
})(typeof globalThis!=='undefined'?globalThis:this);
