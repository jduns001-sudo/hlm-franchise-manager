(function(root){
'use strict';
// Phase 9 missions 466-480: immutable, read-only audit trend history.
const KEYS=['teams','players','contracts','draftPicks','transactions','prospects'];
function record(summary,label){if(!summary||summary.kind!=='cpu-audit-summary'||summary.readOnly!==true||!summary.counts||typeof summary.counts!=='object'||!Number.isSafeInteger(summary.issueCount)||summary.issueCount<0)throw new TypeError('Valid audit summary required');const counts={};for(const k of KEYS){const v=summary.counts[k];if(!Number.isSafeInteger(v)||v<0)throw new TypeError('Invalid count: '+k);counts[k]=v;}return Object.freeze({label:String(label??'').slice(0,100),controlledTeamId:summary.controlledTeamId??null,issueCount:summary.issueCount,counts:Object.freeze(counts)});}
function trend(entries){if(!Array.isArray(entries)||entries.length>100)throw new TypeError('Up to 100 entries required');const history=Object.freeze(entries.map((e,i)=>record(e.summary,e.label??String(i+1))));const first=history[0],last=history[history.length-1],delta={};for(const k of KEYS)delta[k]=first?last.counts[k]-first.counts[k]:0;return Object.freeze({kind:'cpu-audit-trend',readOnly:true,entries:history,delta:Object.freeze(delta),issueCountChange:first?last.issueCount-first.issueCount:0,controlledTeamChanged:first?first.controlledTeamId!==last.controlledTeamId:false});}
const api=Object.freeze({record,trend});if(typeof module!=='undefined'&&module.exports)module.exports=api;root.HFMCPUAuditTrends=api;
})(typeof globalThis!=='undefined'?globalThis:this);
