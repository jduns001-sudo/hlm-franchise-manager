(function(root){
'use strict';
// Read-only comparison of two privacy-safe advisory reports.
const reports=(typeof module!=='undefined'&&module.exports)?require('./cpu-audit-advisory-report'):root.HFMCPUAuditAdvisoryReport;
const allowed=['Data issue count increased','Team count decreased','Player count decreased','Draft pick count decreased'];
function compare(before,after){
 const a=reports.validate(before),b=reports.validate(after);
 const added=allowed.filter(w=>b.warnings.includes(w)&&!a.warnings.includes(w));
 const resolved=allowed.filter(w=>a.warnings.includes(w)&&!b.warnings.includes(w));
 const unchanged=allowed.filter(w=>a.warnings.includes(w)&&b.warnings.includes(w));
 return Object.freeze({kind:'cpu-audit-advisory-diff',readOnly:true,added:Object.freeze(added),resolved:Object.freeze(resolved),unchanged:Object.freeze(unchanged),reviewChanged:a.requiresReview!==b.requiresReview,issueTrendChanged:a.issueTrend!==b.issueTrend});
}
function describe(before,after){
 const d=compare(before,after);
 return ['Advisory change summary (read-only)','New warnings: '+(d.added.join('; ')||'none'),'Resolved warnings: '+(d.resolved.join('; ')||'none'),'Continuing warnings: '+(d.unchanged.join('; ')||'none'),'Review status changed: '+d.reviewChanged,'Issue trend changed: '+d.issueTrendChanged].join('\n');
}
const api=Object.freeze({compare,describe});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.HFMCPUAuditAdvisoryDiff=api;
})(typeof globalThis!=='undefined'?globalThis:this);
