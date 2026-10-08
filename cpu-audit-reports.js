(function(root){
'use strict';
// Phase 9 missions 451-465: deterministic read-only audit report and comparison.
function isRecord(x){return x!==null&&typeof x==='object'&&!Array.isArray(x);}
function validate(a){if(!isRecord(a)||a.kind!=='cpu-legacy-audit'||a.readOnly!==true||!isRecord(a.counts)||!Array.isArray(a.warnings))throw new TypeError('Valid read-only legacy audit required');return a;}
function summarize(a){validate(a);const counts={};for(const key of ['teams','players','contracts','draftPicks','transactions','prospects'])counts[key]=Number.isSafeInteger(a.counts[key])&&a.counts[key]>=0?a.counts[key]:0;return Object.freeze({kind:'cpu-audit-summary',readOnly:true,found:a.found===true,controlledTeamId:a.controlledTeamId??null,counts:Object.freeze(counts),issues:Object.freeze([...a.warnings].filter(x=>typeof x==='string')),issueCount:a.warnings.filter(x=>typeof x==='string').length});}
function compare(previous,current){const before=summarize(previous),after=summarize(current),delta={};for(const key of Object.keys(after.counts))delta[key]=after.counts[key]-before.counts[key];return Object.freeze({kind:'cpu-audit-comparison',readOnly:true,delta:Object.freeze(delta),controlledTeamChanged:before.controlledTeamId!==after.controlledTeamId,issueCountChange:after.issueCount-before.issueCount});}
function exportReport(a){return JSON.stringify(summarize(a),null,2);}
function exportCSV(a){const s=summarize(a);return 'dataset,count\n'+Object.entries(s.counts).map(([k,v])=>k+','+v).join('\n')+'\n';}
const api=Object.freeze({summarize,compare,exportReport,exportCSV});if(typeof module!=='undefined'&&module.exports)module.exports=api;root.HFMCPUAuditReports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
