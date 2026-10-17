/* Mission 1256: deterministic human GM manual collection action workstreams; no source validation. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./hlm-phase11-gm-manual-collection-readiness'):null);if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMGMManualCollectionActionPlan=api;})(typeof globalThis!=='undefined'?globalThis:this,function(dep){
'use strict';
function plan(review,approved){
if(approved!==true)throw Error('Explicit human GM approval required');
const source=dep||(typeof globalThis!=='undefined'&&globalThis.HLMGMManualCollectionReadiness);
if(!source||typeof source.prioritize!=='function')throw Error('Manual collection readiness unavailable');
const report=source.prioritize(review,true);
const definitions=[{id:'provenance',title:'Document source provenance',fields:p=>p.missingProvenanceFields.map(field=>({field,action:'Document source provenance: '+field}))},{id:'source-reference',title:'Collect independent source references',fields:p=>p.missingSourceReference?[{field:'source-reference',action:'Record independent source reference'}]:[]},{id:'observed-evidence',title:'Record observed source evidence',fields:p=>p.missingObservedEvidence?[{field:'observed-evidence',action:'Record observed source evidence'}]:[]},{id:'verification-notes',title:'Record human verification notes',fields:p=>p.missingVerificationNotes?[{field:'verification-notes',action:'Record human verification notes'}]:[]}];
const workstreams=definitions.map(def=>{
const tasks=[];for(const p of report.packets)for(const missing of def.fields(p))tasks.push({taskId:def.id+'-'+p.packetId+'-'+missing.field,packetId:p.packetId,gateId:p.gateId,collectionPriority:p.collectionPriority,sourceScope:p.sourceScope,field:missing.field,humanAction:missing.action,uncertainty:p.uncertainty,evidenceNeeded:p.evidenceNeeded,reviewAcknowledged:p.reviewAcknowledged,taskStatus:'not-collected',sourceVerification:'not-performed',eligibility:'unknown'});
return {workstreamId:def.id,title:def.title,taskCount:tasks.length,tasks};
});
return {kind:'experimental-gm-manual-collection-action-plan',workstreams,workstreamCount:workstreams.length,taskCount:workstreams.reduce((n,w)=>n+w.taskCount,0),packetCount:report.packetCount,unresolvedPacketCount:report.incompletePacketCount,acknowledgedButUnverifiedCount:report.acknowledgedButUnverifiedCount,sourceVerification:'not-performed',evidenceResolution:'unresolved',eligibility:'unknown',confidence:'not-established',warning:'Tasks are instructions for independent human evidence collection only. Missing fields and readiness are not source verification, resolved evidence or player eligibility.',productionActivationAllowed:false,persistencePerformed:false,automaticTransactionsAllowed:false,automaticRosterChangesAllowed:false,finalDecisionMaker:'human-gm'};
}
return {plan};});