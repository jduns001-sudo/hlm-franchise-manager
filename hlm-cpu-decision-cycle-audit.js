'use strict';
const {createCPUDecisionCycleSummary}=require('./hlm-cpu-decision-cycle-summary');
function createCPUDecisionCycleAudit(state,teamId,options={}){
 const summaryPackage=createCPUDecisionCycleSummary(state,teamId,options);
 const s=summaryPackage.summary;
 const stages=Object.freeze([
  Object.freeze({stage:'candidate',passed:s.candidateValid}),
  Object.freeze({stage:'authorization',passed:s.humanAuthorized}),
  Object.freeze({stage:'readiness',passed:s.executionReady}),
  Object.freeze({stage:'request',passed:s.requestAccepted}),
  Object.freeze({stage:'preflight',passed:s.preflightPassed}),
  Object.freeze({stage:'verification',passed:s.verificationPassed}),
  Object.freeze({stage:'outcome',passed:s.actionPerformed})
 ]);
 const firstBlocked=stages.find(x=>!x.passed);
 return Object.freeze({
  kind:'cpu-decision-cycle-audit',version:1,teamId:summaryPackage.teamId,
  summaryPackage,stages,
  audit:Object.freeze({allGatesPassed:stages.slice(0,-1).every(x=>x.passed),firstIncompleteStage:firstBlocked?.stage??null,
   outcomeStatus:s.outcomeStatus,actionPerformed:false,cycleCompleted:false,persisted:false}),
  authority:summaryPackage.authority,sourceStateMutated:false,persistencePerformed:false
 });
}
module.exports={createCPUDecisionCycleAudit};
