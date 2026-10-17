/* Mission 1270: deterministic, read-only verification dependency and blocker triage. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./hlm-phase11-gm-human-verification-execution-checklist'):null);if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMGMVerificationDependencyBlockerTriage=api;})(typeof globalThis!=='undefined'?globalThis:this,function(dep){
'use strict';
function triage(review,annotations,approved){
if(approved!==true)throw Error('Explicit human GM approval required');
const source=dep||(typeof globalThis!=='undefined'&&globalThis.HLMGMHumanVerificationExecutionChecklist);
if(!source||typeof source.checklist!=='function')throw Error('Human verification execution checklist unavailable');
const report=source.checklist(review,annotations,true);
const groups=[];
for(const round of report.rounds){
const prerequisite=round.sourceDependency.prerequisite,priority=round.humanHandoffPriority;
const key=JSON.stringify([prerequisite,priority]);
let group=groups.find(g=>g.key===key);
if(!group){group={key,prerequisite,priority,roundNumbers:[],sourceDependencies:[],unresolvedBlockers:[],checks:[],notCollectedCount:0,manuallyDocumentedStillUnverifiedCount:0,repeatedDependencyCount:0,futureIndependentVerificationCriteria:[],nextHumanActions:[]};groups.push(group)}
group.roundNumbers.push(round.roundNumber);
group.sourceDependencies.push({evidenceNeeded:round.evidenceNeeded,roundNumber:round.roundNumber,prerequisite,dependencyStatus:round.sourceDependency.status,repeatedAcrossSessions:round.repeatedAcrossSessions,repeatedAcrossGates:round.repeatedAcrossGates});
for(const blocker of round.unresolvedBlockers)if(!group.unresolvedBlockers.includes(blocker))group.unresolvedBlockers.push(blocker);
for(const criterion of round.futureIndependentVerificationCriteria)if(!group.futureIndependentVerificationCriteria.includes(criterion))group.futureIndependentVerificationCriteria.push(criterion);
if(round.repeatedAcrossSessions||round.repeatedAcrossGates)group.repeatedDependencyCount++;
for(const check of round.checks){
group.checks.push({roundNumber:round.roundNumber,taskId:check.taskId,gateId:check.gateId,sessionNumber:check.sessionNumber,documentationStatus:check.documentationStatus,remainingGap:check.remainingGap,uncertainty:check.uncertainty,outstandingQuestion:check.outstandingQuestion,nextHumanVerificationAction:check.nextHumanVerificationAction,futureIndependentVerificationCriteria:[...check.independentVerificationCriteria],checked:false,completionStatus:'not-completed',sourceVerification:'not-performed',evidenceResolution:'unresolved',eligibility:'unknown'});
if(check.documentationStatus==='not-collected')group.notCollectedCount++;
if(check.documentationStatus==='manually-documented-still-unverified')group.manuallyDocumentedStillUnverifiedCount++;
if(!group.nextHumanActions.includes(check.nextHumanVerificationAction))group.nextHumanActions.push(check.nextHumanVerificationAction);
}
}
return {kind:'experimental-gm-verification-dependency-blocker-triage',groups:groups.map(({key,...g})=>({...g,groupStatus:'blocked-pending-independent-source-verification',checkCount:g.checks.length,documentationStatus:g.notCollectedCount&&g.manuallyDocumentedStillUnverifiedCount?'mixed-unverified':g.manuallyDocumentedStillUnverifiedCount?'manually-documented-still-unverified':'not-collected',completedCheckCount:0,sourceVerification:'not-performed',evidenceResolution:'unresolved',eligibility:'unknown'})),groupCount:groups.length,roundCount:report.roundCount,checkCount:report.checkCount,sessionCount:report.sessionCount,gateCount:report.gateCount,notCollectedCount:report.notCollectedCount,manuallyDocumentedStillUnverifiedCount:report.manuallyDocumentedStillUnverifiedCount,repeatedDependencyCount:report.repeatedDependencyCount,unresolvedVerificationCount:report.unresolvedVerificationCount,completedCheckCount:0,readiness:'blocked-pending-human-evidence-and-independent-verification',sourceVerification:'not-performed',evidenceResolution:'unresolved',eligibility:'unknown',confidence:'not-established',warning:'Dependency triage is an in-memory human verification plan, not evidence verification. No check completed; documented evidence remains unverified and eligibility unknown.',productionActivationAllowed:false,persistencePerformed:false,automaticTransactionsAllowed:false,automaticRosterChangesAllowed:false,finalDecisionMaker:'human-gm'};
}
return {triage};});