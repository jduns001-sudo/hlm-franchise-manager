(function(root){
'use strict';
// Bounded, in-memory aggregate advisory timeline. No storage or save mutation.
const reports=(typeof module!=='undefined'&&module.exports)?require('./cpu-audit-advisory-report'):root.HFMCPUAuditAdvisoryReport;
const diffs=(typeof module!=='undefined'&&module.exports)?require('./cpu-audit-advisory-diff'):root.HFMCPUAuditAdvisoryDiff;
const MAX=20;
function summarize(items){
 if(!Array.isArray(items)||items.length>MAX)throw new TypeError('Advisory timeline must contain at most 20 reports');
 const entries=items.map(item=>reports.validate(item));
 const transitions=[];
 for(let i=1;i<entries.length;i++)transitions.push(diffs.compare(entries[i-1],entries[i]));
 const reviewCount=entries.filter(x=>x.requiresReview).length;
 return Object.freeze({kind:'cpu-audit-advisory-timeline',readOnly:true,count:entries.length,reviewCount,latest:entries.length?entries[entries.length-1]:null,transitions:Object.freeze(transitions)});
}
function describe(items){
 const summary=summarize(items);
 return 'Aggregate advisory timeline (read-only)\nReports: '+summary.count+'\nReview flagged: '+summary.reviewCount+'\nTransitions: '+summary.transitions.length;
}
const api=Object.freeze({summarize,describe,MAX});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.HFMCPUAuditAdvisoryTimeline=api;
})(typeof globalThis!=='undefined'?globalThis:this);
