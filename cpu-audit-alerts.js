(function(root){
'use strict';
// Phase 9 missions 481-495: deterministic advisory alerts from read-only audit trends.
const FIELDS=['teams','players','contracts','draftPicks','transactions','prospects'];
function alerts(trend,thresholds={}){
 if(!trend||trend.kind!=='cpu-audit-trend'||trend.readOnly!==true||!trend.delta||typeof trend.delta!=='object'||!Array.isArray(trend.entries))throw new TypeError('Read-only audit trend required');
 const out=[];for(const field of FIELDS){const delta=trend.delta[field];if(!Number.isSafeInteger(delta))throw new TypeError('Invalid trend delta: '+field);const threshold=thresholds[field]??1;if(!Number.isSafeInteger(threshold)||threshold<1)throw new TypeError('Invalid threshold: '+field);if(Math.abs(delta)>=threshold)out.push(Object.freeze({code:'count-change',field,delta,severity:field==='players'||field==='contracts'?'review':'info',message:field+' changed by '+delta}));}
 if(trend.controlledTeamChanged)out.push(Object.freeze({code:'controlled-team-change',severity:'review',message:'Controlled team changed'}));
 if(!Number.isSafeInteger(trend.issueCountChange))throw new TypeError('Invalid issue change');
 if(trend.issueCountChange>0)out.push(Object.freeze({code:'new-data-issues',severity:'review',delta:trend.issueCountChange,message:'Data issues increased by '+trend.issueCountChange}));
 return Object.freeze({kind:'cpu-audit-alerts',readOnly:true,alerts:Object.freeze(out),count:out.length,hasReviewItems:out.some(x=>x.severity==='review')});
}
const api=Object.freeze({alerts});if(typeof module!=='undefined'&&module.exports)module.exports=api;root.HFMCPUAuditAlerts=api;
})(typeof globalThis!=='undefined'?globalThis:this);
