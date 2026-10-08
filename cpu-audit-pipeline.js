(function(root){
'use strict';
// Phase 9 missions 496-510: compose existing read-only audit modules.
function pipeline(storage, previous, thresholds){
 const auditApi=root.HFMCPULegacyAudit||(typeof require==='function'?require('./cpu-legacy-audit'):null);
 const reportApi=root.HFMCPUAuditReports||(typeof require==='function'?require('./cpu-audit-reports'):null);
 const trendApi=root.HFMCPUAuditTrends||(typeof require==='function'?require('./cpu-audit-trends'):null);
 const alertApi=root.HFMCPUAuditAlerts||(typeof require==='function'?require('./cpu-audit-alerts'):null);
 if(!auditApi||!reportApi||!trendApi||!alertApi)throw new Error('Audit modules unavailable');
 const audit=auditApi.auditLegacy(storage);
 if(!audit.found)return Object.freeze({kind:'cpu-audit-pipeline',found:false,readOnly:true,audit,summary:null,trend:null,alerts:null});
 const summary=reportApi.summarize(audit);
 const entries=previous==null?[{summary,label:'current'}]:[{summary:previous,label:'previous'},{summary,label:'current'}];
 const trend=trendApi.trend(entries);
 const alerts=alertApi.alerts(trend,thresholds);
 return Object.freeze({kind:'cpu-audit-pipeline',found:true,readOnly:true,audit,summary,trend,alerts});
}
const api=Object.freeze({pipeline});if(typeof module!=='undefined'&&module.exports)module.exports=api;root.HFMCPUAuditPipeline=api;
})(typeof globalThis!=='undefined'?globalThis:this);
