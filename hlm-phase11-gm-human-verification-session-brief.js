/* Mission 1263: read-only, deterministic human GM verification session brief. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./hlm-phase11-gm-cross-gate-human-action-queue'):null);if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMGMHumanVerificationSessionBrief=api;})(typeof globalThis!=='undefined'?globalThis:this,function(dep){
'use strict';
function brief(review,annotations,approved){
if(approved!==true)throw Error('Explicit human GM approval required');
const source=dep||(typeof globalThis!=='undefined'&&globalThis.HLMGMCrossGateHumanActionQueue);
if(!source||typeof source.queue!=='function')throw Error('Cross-gate human verification queue unavailable');
const queue=source.queue(review,annotations,true),sessions=[],byWorkstream=new Map();
for(const action of queue.actions){
const key=String(action.workstreamId);
let session=byWorkstream.get(key);
if(!session){session={workstreamId:action.workstreamId,actions:[],notCollectedCount:0,manuallyDocumentedStillUnverifiedCount:0,sourceDependencies:[],blockers:[],questions:[],completionCriteria:['Collect human documentation for each not-collected item, if applicable.','Independently verify all candidate source evidence outside this preview.','Request a separate human GM decision after evidence verification; this preview never establishes eligibility.'],readiness:'blocked-pending-human-evidence-and-independent-verification',sourceVerification:'not-performed',evidenceResolution:'unresolved',eligibility:'unknown',confidence:'not-established'};byWorkstream.set(key,session);sessions.push(session)}
const copy={...action,gateBlockers:[...action.gateBlockers]};session.actions.push(copy);if(action.documentationStatus==='not-collected')session.notCollectedCount++;else session.manuallyDocumentedStillUnverifiedCount++;
if(!session.sourceDependencies.some(d=>d.evidenceNeeded===action.evidenceNeeded))session.sourceDependencies.push({evidenceNeeded:action.evidenceNeeded,sourceVerification:'not-performed',evidenceResolution:'unresolved',eligibility:'unknown'});
for(const blocker of action.gateBlockers)if(!session.blockers.includes(blocker))session.blockers.push(blocker);
session.questions.push({taskId:action.taskId,gateId:action.gateId,question:action.humanVerificationQuestion,humanNextAction:action.humanNextAction,documentationStatus:action.documentationStatus,remainingGap:action.remainingGap,uncertainty:action.uncertainty,sourceVerification:'not-performed',evidenceResolution:'unresolved',eligibility:'unknown'});
}
sessions.forEach((s,i)=>{s.sessionNumber=i+1;s.actionCount=s.actions.length;s.firstQueuePosition=s.actions[0].queuePosition;s.nextHumanVerificationQuestion=s.questions[0].question;s.completionStatus='not-completed';s.humanHandoffPriority=s.notCollectedCount>0?'collection-and-source-verification':'source-verification-required'});
return {kind:'experimental-gm-human-verification-session-brief',sessions,sessionCount:sessions.length,actionCount:queue.actionCount,gateCount:queue.gateCount,notCollectedCount:queue.notCollectedCount,manuallyDocumentedStillUnverifiedCount:queue.manuallyDocumentedStillUnverifiedCount,unresolvedVerificationCount:queue.unresolvedVerificationCount,readiness:'blocked-pending-human-evidence-and-independent-verification',sourceVerification:'not-performed',evidenceResolution:'unresolved',eligibility:'unknown',confidence:'not-established',warning:'Session completion criteria are instructions for future human verification, not completed checks. All evidence remains unresolved and eligibility unknown.',productionActivationAllowed:false,persistencePerformed:false,automaticTransactionsAllowed:false,automaticRosterChangesAllowed:false,finalDecisionMaker:'human-gm'};
}
return {brief};});