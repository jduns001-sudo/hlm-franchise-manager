/* Mission 1264: deterministic read-only cross-session source dependency coverage and human handoff checklist. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./hlm-phase11-gm-human-verification-session-brief'):null);if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMGMCrossSessionDependencyCoverage=api;})(typeof globalThis!=='undefined'?globalThis:this,function(dep){
'use strict';
function coverage(review,annotations,approved){
if(approved!==true)throw Error('Explicit human GM approval required');
const source=dep||(typeof globalThis!=='undefined'&&globalThis.HLMGMHumanVerificationSessionBrief);
if(!source||typeof source.brief!=='function')throw Error('Human verification session brief unavailable');
const report=source.brief(review,annotations,true),dependencies=[],byEvidence=new Map();
for(const session of report.sessions){
for(const action of session.actions){
const key=String(action.evidenceNeeded);
let item=byEvidence.get(key);
if(!item){item={evidenceNeeded:action.evidenceNeeded,workstreamIds:[],sessionNumbers:[],gateIds:[],taskIds:[],questions:[],blockers:[],notCollectedCount:0,manuallyDocumentedStillUnverifiedCount:0,firstQueuePosition:action.queuePosition,sourceVerification:'not-performed',evidenceResolution:'unresolved',eligibility:'unknown',confidence:'not-established',completionStatus:'not-completed',futureIndependentVerificationCriteria:['Collect missing human source documentation, where applicable.','Independently check each candidate source against authoritative evidence outside this preview.','Have the human GM review verified evidence separately; this checklist never determines eligibility.']};byEvidence.set(key,item);dependencies.push(item)}
if(!item.workstreamIds.includes(session.workstreamId))item.workstreamIds.push(session.workstreamId);
if(!item.sessionNumbers.includes(session.sessionNumber))item.sessionNumbers.push(session.sessionNumber);
if(!item.gateIds.includes(action.gateId))item.gateIds.push(action.gateId);
item.taskIds.push(action.taskId);
item.questions.push({taskId:action.taskId,gateId:action.gateId,sessionNumber:session.sessionNumber,documentationStatus:action.documentationStatus,remainingGap:action.remainingGap,uncertainty:action.uncertainty,question:action.humanVerificationQuestion,humanNextAction:action.humanNextAction,sourceVerification:'not-performed',evidenceResolution:'unresolved',eligibility:'unknown'});
for(const blocker of action.gateBlockers)if(!item.blockers.includes(blocker))item.blockers.push(blocker);
if(action.documentationStatus==='not-collected')item.notCollectedCount++;else item.manuallyDocumentedStillUnverifiedCount++;
}
}
dependencies.forEach(item=>{item.actionCount=item.taskIds.length;item.repeatedAcrossSessions=item.sessionNumbers.length>1;item.repeatedAcrossGates=item.gateIds.length>1;item.handoffPriority=item.notCollectedCount>0?'collect-and-independently-verify':'independently-verify-manual-documentation'});
dependencies.sort((a,b)=>Number(b.repeatedAcrossSessions)-Number(a.repeatedAcrossSessions)||b.sessionNumbers.length-a.sessionNumbers.length||b.actionCount-a.actionCount||a.firstQueuePosition-b.firstQueuePosition||String(a.evidenceNeeded).localeCompare(String(b.evidenceNeeded)));
dependencies.forEach((item,i)=>{item.handoffOrder=i+1});
return {kind:'experimental-gm-cross-session-source-dependency-coverage',dependencies,dependencyCount:dependencies.length,repeatedAcrossSessionsCount:dependencies.filter(d=>d.repeatedAcrossSessions).length,repeatedAcrossGatesCount:dependencies.filter(d=>d.repeatedAcrossGates).length,sessionCount:report.sessionCount,actionCount:report.actionCount,gateCount:report.gateCount,notCollectedCount:report.notCollectedCount,manuallyDocumentedStillUnverifiedCount:report.manuallyDocumentedStillUnverifiedCount,unresolvedVerificationCount:report.unresolvedVerificationCount,readiness:'blocked-pending-human-evidence-and-independent-verification',sourceVerification:'not-performed',evidenceResolution:'unresolved',eligibility:'unknown',confidence:'not-established',warning:'Repeated dependencies are unresolved human source-check handoffs, not verified evidence. Completion criteria are future independent checks only.',productionActivationAllowed:false,persistencePerformed:false,automaticTransactionsAllowed:false,automaticRosterChangesAllowed:false,finalDecisionMaker:'human-gm'};
}
return {coverage};});