/* Mission 1262: deterministic, read-only cross-gate human source-check action queue. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./hlm-phase11-gm-verification-readiness-priorities'):null);if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMGMCrossGateHumanActionQueue=api;})(typeof globalThis!=='undefined'?globalThis:this,function(dep){
'use strict';
function queue(review,annotations,approved){
if(approved!==true)throw Error('Explicit human GM approval required');
const source=dep||(typeof globalThis!=='undefined'&&globalThis.HLMGMVerificationReadinessPriorities);
if(!source||typeof source.prioritize!=='function')throw Error('Verification readiness priorities unavailable');
const summary=source.prioritize(review,annotations,true);
const actions=[];
for(const gate of summary.gatePriorities){
for(const question of gate.questions){
const dependency=gate.dependencies.find(d=>d.sequenceNumbers.includes(question.sequenceNumber));
if(!dependency)throw Error('Missing source dependency for human verification question');
const needsCollection=question.documentationStatus==='not-collected';
actions.push({gateId:gate.gateId,taskId:question.taskId,sourceSequenceNumber:question.sequenceNumber,workstreamId:dependency.workstreamId,evidenceNeeded:question.evidenceNeeded,documentationStatus:question.documentationStatus,remainingGap:question.remainingGap,uncertainty:question.uncertainty,blockingReason:dependency.blockingReason,gateBlockers:[...gate.blockers],humanVerificationQuestion:question.humanVerificationQuestion,humanNextAction:needsCollection?'Collect missing human source documentation; independently verify authoritative source before any eligibility judgment.':'Independently verify the manually documented source against authoritative evidence; do not infer eligibility.',handoffPriority:needsCollection?'collect-before-independent-verification':'independent-verification-required',sourceVerification:'not-performed',evidenceResolution:'unresolved',eligibility:'unknown',confidence:'not-established'});
}
}
actions.sort((a,b)=>(a.handoffPriority==='collect-before-independent-verification'?0:1)-(b.handoffPriority==='collect-before-independent-verification'?0:1)||a.sourceSequenceNumber-b.sourceSequenceNumber||String(a.taskId).localeCompare(String(b.taskId)));
actions.forEach((a,i)=>{a.queuePosition=i+1});
return {kind:'experimental-gm-cross-gate-human-action-queue',actions,actionCount:actions.length,gateCount:summary.gateCount,notCollectedCount:summary.notCollectedCount,manuallyDocumentedStillUnverifiedCount:summary.manuallyDocumentedStillUnverifiedCount,unresolvedVerificationCount:summary.unresolvedVerificationCount,readiness:'blocked-pending-human-evidence-and-independent-verification',sourceVerification:'not-performed',evidenceResolution:'unresolved',eligibility:'unknown',confidence:'not-established',warning:'This is an advisory human action queue only. Source checks are not executed, evidence remains unresolved, and no player eligibility is inferred.',productionActivationAllowed:false,persistencePerformed:false,automaticTransactionsAllowed:false,automaticRosterChangesAllowed:false,finalDecisionMaker:'human-gm'};
}
return {queue};});