/* Mission 1259: deterministic read-only cross-workstream human verification handoff. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./hlm-phase11-gm-manual-collection-gap-followup'):null);if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMGMManualCollectionHandoff=api;})(typeof globalThis!=='undefined'?globalThis:this,function(dep){
'use strict';
function prepare(review,annotations,approved){
if(approved!==true)throw Error('Explicit human GM approval required');
const source=dep||(typeof globalThis!=='undefined'&&globalThis.HLMGMManualCollectionGapFollowup);
if(!source||typeof source.plan!=='function')throw Error('Manual collection gap follow-up unavailable');
const gaps=source.plan(review,annotations,true);
const sequence=gaps.followups.map((task,index)=>({
sequenceNumber:index+1,taskId:task.taskId,packetId:task.packetId,gateId:task.gateId,workstreamId:task.workstreamId,collectionPriority:task.collectionPriority,
documentationStatus:task.documentationStatus,documentationNote:task.documentationNote,remainingGap:task.remainingGap,uncertainty:task.uncertainty,evidenceNeeded:task.evidenceNeeded,
humanHandoffAction:task.nextHumanAction,humanVerificationQuestion:task.verificationQuestion,
handoffStatus:task.documentationStatus==='not-collected'?'awaiting-human-collection':'awaiting-independent-human-verification',
sourceVerification:'not-performed',evidenceResolution:'unresolved',eligibility:'unknown',confidence:'not-established'
}));
const workstreams=gaps.workstreams.map(w=>({workstreamId:w.workstreamId,title:w.title,taskCount:w.taskCount,notCollectedCount:w.notCollectedCount,manuallyDocumentedStillUnverifiedCount:w.manuallyDocumentedStillUnverifiedCount,unresolvedVerificationCount:w.unresolvedVerificationCount,sequenceNumbers:sequence.filter(t=>t.workstreamId===w.workstreamId).map(t=>t.sequenceNumber)}));
return {kind:'experimental-gm-cross-workstream-verification-handoff',sequence,workstreams,workstreamCount:workstreams.length,taskCount:gaps.taskCount,notCollectedCount:gaps.notCollectedCount,manuallyDocumentedStillUnverifiedCount:gaps.manuallyDocumentedStillUnverifiedCount,unresolvedVerificationCount:gaps.unresolvedVerificationCount,unresolvedPacketCount:gaps.unresolvedPacketCount,sourceVerification:'not-performed',evidenceResolution:'unresolved',eligibility:'unknown',confidence:'not-established',warning:'Sequencing is advisory only. Human notes and handoff questions never verify sources, resolve evidence or establish eligibility. No action has been performed.',productionActivationAllowed:false,persistencePerformed:false,automaticTransactionsAllowed:false,automaticRosterChangesAllowed:false,finalDecisionMaker:'human-gm'};
}
return {prepare};});