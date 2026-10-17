/* Mission 1257: isolated, read-only human evidence documentation progress preview. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./hlm-phase11-gm-manual-collection-action-plan'):null);if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMGMManualCollectionProgress=api;})(typeof globalThis!=='undefined'?globalThis:this,function(dep){
'use strict';
function preview(review,annotations,approved){
if(approved!==true)throw Error('Explicit human GM approval required');
const source=dep||(typeof globalThis!=='undefined'&&globalThis.HLMGMManualCollectionActionPlan);
if(!source||typeof source.plan!=='function')throw Error('Manual collection action plan unavailable');
if(!Array.isArray(annotations))throw Error('In-memory annotations array required');
const report=source.plan(review,true),tasks=report.workstreams.flatMap(w=>w.tasks),byId=new Map(tasks.map(t=>[t.taskId,t])),notes=new Map();
for(const a of annotations){
if(!a||typeof a!=='object'||Array.isArray(a)||typeof a.taskId!=='string'||!byId.has(a.taskId))throw Error('Unknown manual collection task annotation');
if(notes.has(a.taskId))throw Error('Duplicate manual collection task annotation');
if(typeof a.note!=='string'||!a.note.trim()||a.note.length>1000)throw Error('Nonempty bounded human documentation note required');
notes.set(a.taskId,a.note.trim());
}
const workstreams=report.workstreams.map(w=>{
const entries=w.tasks.map(t=>{const note=notes.get(t.taskId)||null;return {...t,documentationNote:note,documentationStatus:note?'manually-documented-still-unverified':'not-collected',taskStatus:note?'manually-documented-still-unverified':'not-collected',sourceVerification:'not-performed',evidenceResolution:'unresolved',eligibility:'unknown',confidence:'not-established'};});
return {workstreamId:w.workstreamId,title:w.title,taskCount:entries.length,notCollectedCount:entries.filter(t=>!t.documentationNote).length,manuallyDocumentedStillUnverifiedCount:entries.filter(t=>!!t.documentationNote).length,tasks:entries};
});
const documentedCount=workstreams.reduce((n,w)=>n+w.manuallyDocumentedStillUnverifiedCount,0);
return {kind:'experimental-gm-manual-collection-progress-preview',workstreams,workstreamCount:workstreams.length,taskCount:report.taskCount,notCollectedCount:report.taskCount-documentedCount,manuallyDocumentedStillUnverifiedCount:documentedCount,packetCount:report.packetCount,unresolvedPacketCount:report.unresolvedPacketCount,sourceVerification:'not-performed',evidenceResolution:'unresolved',eligibility:'unknown',confidence:'not-established',warning:'Manually documented is still unverified. Notes are isolated in memory only; no evidence resolution, source validation or eligibility is implied.',productionActivationAllowed:false,persistencePerformed:false,automaticTransactionsAllowed:false,automaticRosterChangesAllowed:false,finalDecisionMaker:'human-gm'};
}
return {preview};});