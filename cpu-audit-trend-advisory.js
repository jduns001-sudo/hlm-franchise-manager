(function(root){
'use strict';
// Advisory-only audit trend gate. Never authorizes CPU actions or save writes.
const integrity=(typeof module!=='undefined'&&module.exports)?require('./cpu-audit-integrity'):root.HFMCPUAuditIntegrity;
const diagnostics=(typeof module!=='undefined'&&module.exports)?require('./cpu-audit-comparison-diagnostics'):root.HFMCPUAuditComparisonDiagnostics;
function assess(input){
 const value=integrity.validateComparison(input);
 const summary=diagnostics.analyze(value);
 const warnings=[];
 if(value.issueDelta>0)warnings.push('Data issue count increased');
 if(summary.decreased.includes('teams'))warnings.push('Team count decreased');
 if(summary.decreased.includes('players'))warnings.push('Player count decreased');
 if(summary.decreased.includes('draftPicks'))warnings.push('Draft pick count decreased');
 return Object.freeze({kind:'cpu-audit-trend-advisory',readOnly:true,requiresReview:warnings.length>0,issueTrend:summary.issueTrend,warnings:Object.freeze(warnings),changed:summary.changed});
}
function describe(input){
 const value=assess(input);
 return 'Audit trend review: '+(value.requiresReview?'review suggested':'no flagged aggregate changes')+'\n'+(value.warnings.join('\n')||'No aggregate warnings')+'\nAdvisory only; no save changes or CPU authorization.';
}
const api=Object.freeze({assess,describe});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.HFMCPUAuditTrendAdvisory=api;
})(typeof globalThis!=='undefined'?globalThis:this);
