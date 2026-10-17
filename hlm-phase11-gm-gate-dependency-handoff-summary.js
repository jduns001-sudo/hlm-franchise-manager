/* Mission 1260: deterministic read-only evidence-gate and source-dependency human handoff summary. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./hlm-phase11-gm-manual-collection-handoff'):null);if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMGMGateDependencyHandoffSummary=api;})(typeof globalThis!=='undefined'?globalThis:this,function(dep){
'use strict';
function summarize(review,annotations,approved){
if(approved!==true)throw Error('Explicit human GM approval required');
const source=dep||(typeof globalThis!=='undefined'&&globalThis.HLMGMManualCollectionHandoff);
if(!source||typeof source.prepare!=='function')throw Error('Manual collection handoff unavailable');
const handoff=source.prepare(review,annotations,true);
const gates=new Map();
for(const task of handoff.sequence){
const gateKey=String(task.gateId),gate=gates.get(gateKey)||{gateId:task.gateId,taskCount:0,notCollectedCount:0,manuallyDocumentedStillUnverifiedCount:0,unresolvedVerificationCount:0,sourceDependencies:new Map(),questions:[],sequenceNumbers:[]};
gate.taskCount++;gate.unresolvedVerificationCount++;gate.sequenceNumbers.push(task.sequenceNumber);
if(task.documentationStatus==='not-collected')gate.notCollectedCount++;else gate.manuallyDocumentedStillUnverifiedCount++;
const dependencyKey=String(task.workstreamId)+'|'+String(task.evidenceNeeded),dependency=gate.sourceDependencies.get(dependencyKey)||{workstreamId:task.workstreamId,evidenceNeeded:task.evidenceNeeded,sourceVerification:'not-performed',evidenceResolution:'unresolved',eligibility:'unknown',notCollectedCount:0,manuallyDocumentedStillUnverifiedCount:0,sequenceNumbers:[]};
if(task.documentationStatus==='not-collected')dependency.notCollectedCount++;else dependency.manuallyDocumentedStillUnverifiedCount++;
dependency.sequenceNumbers.push(task.sequenceNumber);gate.sourceDependencies.set(dependencyKey,dependency);
gate.questions.push({sequenceNumber:task.sequenceNumber,taskId:task.taskId,workstreamId:task.workstreamId,documentationStatus:task.documentationStatus,remainingGap:task.remainingGap,uncertainty:task.uncertainty,evidenceNeeded:task.evidenceNeeded,humanVerificationQuestion:task.humanVerificationQuestion,sourceVerification:'not-performed',evidenceResolution:'unresolved',eligibility:'unknown'});
gates.set(gateKey,gate);
}
const gateSummaries=[...gates.values()].map(g=>({gateId:g.gateId,taskCount:g.taskCount,notCollectedCount:g.notCollectedCount,manuallyDocumentedStillUnverifiedCount:g.manuallyDocumentedStillUnverifiedCount,unresolvedVerificationCount:g.unresolvedVerificationCount,sequenceNumbers:g.sequenceNumbers,sourceDependencies:[...g.sourceDependencies.values()],questions:g.questions,sourceVerification:'not-performed',evidenceResolution:'unresolved',eligibility:'unknown',confidence:'not-established'}));
return {kind:'experimental-gm-gate-source-dependency-handoff-summary',gateSummaries,gateCount:gateSummaries.length,taskCount:handoff.taskCount,notCollectedCount:handoff.notCollectedCount,manuallyDocumentedStillUnverifiedCount:handoff.manuallyDocumentedStillUnverifiedCount,unresolvedVerificationCount:handoff.unresolvedVerificationCount,unresolvedPacketCount:handoff.unresolvedPacketCount,sourceVerification:'not-performed',evidenceResolution:'unresolved',eligibility:'unknown',confidence:'not-established',warning:'Source dependencies and questions are unverified human handoff guidance only. No source validation, evidence resolution or eligibility determination has occurred.',productionActivationAllowed:false,persistencePerformed:false,automaticTransactionsAllowed:false,automaticRosterChangesAllowed:false,finalDecisionMaker:'human-gm'};
}
return {summarize};});