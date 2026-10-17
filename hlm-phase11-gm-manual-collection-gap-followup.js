/* Mission 1258: deterministic read-only evidence collection gap and human follow-up planning. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./hlm-phase11-gm-manual-collection-progress'):null);if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMGMManualCollectionGapFollowup=api;})(typeof globalThis!=='undefined'?globalThis:this,function(dep){
'use strict';
function plan(review,annotations,approved){
if(approved!==true)throw Error('Explicit human GM approval required');
const source=dep||(typeof globalThis!=='undefined'&&globalThis.HLMGMManualCollectionProgress);
if(!source||typeof source.preview!=='function')throw Error('Manual collection progress unavailable');
const progress=source.preview(review,annotations,true);
const workstreams=progress.workstreams.map(w=>{
const tasks=w.tasks.map(t=>({
taskId:t.taskId,packetId:t.packetId,gateId:t.gateId,collectionPriority:t.collectionPriority,sourceScope:t.sourceScope,field:t.field,
documentationStatus:t.documentationStatus,documentationNote:t.documentationNote,
remainingGap:t.documentationStatus==='not-collected'?'human-documentation-not-collected':'independent-source-verification-not-performed',
nextHumanAction:t.documentationStatus==='not-collected'?t.humanAction:'Independently verify the documented evidence against an authoritative source',
verificationQuestion:t.documentationStatus==='not-collected'?'What source material can the human GM independently collect to document '+t.field+' for gate '+t.gateId+'?':'Does an independent authoritative source actually support the human note for '+t.field+' at gate '+t.gateId+'?',
uncertainty:t.uncertainty,evidenceNeeded:t.evidenceNeeded,sourceVerification:'not-performed',evidenceResolution:'unresolved',eligibility:'unknown',confidence:'not-established'
}));
return {workstreamId:w.workstreamId,title:w.title,taskCount:tasks.length,notCollectedCount:w.notCollectedCount,manuallyDocumentedStillUnverifiedCount:w.manuallyDocumentedStillUnverifiedCount,unresolvedVerificationCount:tasks.length,tasks};
});
const followups=workstreams.flatMap(w=>w.tasks.map(t=>({...t,workstreamId:w.workstreamId}))).sort((a,b)=>a.collectionPriority-b.collectionPriority||Number(a.documentationStatus!=='not-collected')-Number(b.documentationStatus!=='not-collected')||a.workstreamId.localeCompare(b.workstreamId)||a.taskId.localeCompare(b.taskId));
return {kind:'experimental-gm-manual-collection-gap-followup',workstreams,workstreamCount:workstreams.length,taskCount:progress.taskCount,notCollectedCount:progress.notCollectedCount,manuallyDocumentedStillUnverifiedCount:progress.manuallyDocumentedStillUnverifiedCount,unresolvedVerificationCount:progress.taskCount,packetCount:progress.packetCount,unresolvedPacketCount:progress.unresolvedPacketCount,followups,sourceVerification:'not-performed',evidenceResolution:'unresolved',eligibility:'unknown',confidence:'not-established',warning:'Follow-up questions are for human evidence collection and independent verification only. Human notes never imply verified sources, resolved evidence, player eligibility or completed verification.',productionActivationAllowed:false,persistencePerformed:false,automaticTransactionsAllowed:false,automaticRosterChangesAllowed:false,finalDecisionMaker:'human-gm'};
}
return {plan};});