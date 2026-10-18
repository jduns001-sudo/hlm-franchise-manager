/* Mission 1272: opt-in, deterministic, read-only cross-group human verification work sessions. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./hlm-phase11-gm-human-verification-action-queue'):null);if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMGMCrossGroupVerificationSessionPlanner=api;})(typeof globalThis!=='undefined'?globalThis:this,function(dep){
'use strict';
function plan(review,annotations,approved){
if(approved!==true)throw Error('Explicit human GM approval required');
const source=dep||(typeof globalThis!=='undefined'&&globalThis.HLMGMHumanVerificationActionQueue);
if(!source||typeof source.queue!=='function')throw Error('GM human verification action queue unavailable');
const report=source.queue(review,annotations,true);
const groups=new Map();
for(const action of report.actions){
const key=JSON.stringify([action.prerequisite,action.humanHandoffPriority]);
if(!groups.has(key))groups.set(key,{prerequisite:action.prerequisite,humanHandoffPriority:action.humanHandoffPriority,actions:[],blockers:new Map()});
const group=groups.get(key);group.actions.push(action);
for(const item of action.sharedBlockers)group.blockers.set(item.blocker,item.affectedCheckCount);
}
const sessions=[...groups.values()].map(group=>{
const actions=group.actions.map(action=>({
queuePosition:action.queuePosition,taskId:action.taskId,roundNumber:action.roundNumber,sessionNumber:action.sessionNumber,gateId:action.gateId,documentationStatus:action.documentationStatus,remainingGap:action.remainingGap,uncertainty:action.uncertainty,outstandingQuestion:action.outstandingQuestion,nextHumanVerificationAction:action.nextHumanVerificationAction,independentVerificationCriteria:[...action.futureIndependentVerificationCriteria],checkCompleted:false,sourceVerification:'not-performed',evidenceResolution:'unresolved',eligibility:'unknown'
}));
return {prerequisite:group.prerequisite,humanHandoffPriority:group.humanHandoffPriority,firstQueuePosition:Math.min(...actions.map(a=>a.queuePosition)),checkCount:actions.length,notCollectedCount:actions.filter(a=>a.documentationStatus==='not-collected').length,manuallyDocumentedStillUnverifiedCount:actions.filter(a=>a.documentationStatus==='manually-documented-still-unverified').length,sharedBlockers:[...group.blockers].map(([blocker,affectedCheckCount])=>({blocker,affectedCheckCount})).sort((a,b)=>b.affectedCheckCount-a.affectedCheckCount||a.blocker.localeCompare(b.blocker)),actions,independentVerificationRequired:true,completionStatus:'not-completed'};
}).sort((a,b)=>a.firstQueuePosition-b.firstQueuePosition||a.prerequisite.localeCompare(b.prerequisite)||a.humanHandoffPriority.localeCompare(b.humanHandoffPriority)).map((session,i)=>({sessionOrder:i+1,...session}));
return {kind:'experimental-gm-cross-group-verification-session-planner',sessions,sessionCount:sessions.length,actionCount:report.actionCount,completedCheckCount:0,notCollectedCount:report.notCollectedCount,manuallyDocumentedStillUnverifiedCount:report.manuallyDocumentedStillUnverifiedCount,sharedBlockers:report.sharedBlockers.map(x=>({...x})),repeatedPrerequisites:report.repeatedPrerequisites.map(x=>({...x})),recommendedOrder:'queue-priority-then-shared-prerequisite',readiness:'blocked-pending-human-evidence-and-independent-verification',sourceVerification:'not-performed',evidenceResolution:'unresolved',eligibility:'unknown',confidence:'not-established',warning:'Sessions are suggested human review order only. Documentation does not constitute independent verification. No checks are completed and eligibility remains unknown.',productionActivationAllowed:false,persistencePerformed:false,automaticTransactionsAllowed:false,automaticRosterChangesAllowed:false,finalDecisionMaker:'human-gm'};
}
return {plan};});