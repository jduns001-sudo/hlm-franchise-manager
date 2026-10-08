'use strict';
const {assessCPUActionOutcome}=require('./hlm-cpu-action-outcome-assessment');
function createCPUDecisionCycleSummary(state,teamId,options={}){
 const outcomePackage=assessCPUActionOutcome(state,teamId,options);
 const verification=outcomePackage.verificationPackage;
 const preflight=verification.preflightPackage;
 const request=preflight.requestPackage;
 const readiness=request.readinessPackage;
 const authorization=readiness.authorizationPackage;
 const candidate=authorization.candidate;
 return Object.freeze({
  kind:'cpu-decision-cycle-summary',version:1,teamId:outcomePackage.teamId,
  outcomePackage,
  summary:Object.freeze({
   priorityId:candidate.action.priorityId,
   optionId:candidate.action.optionId,
   problemId:candidate.action.problemId,
   actionType:candidate.action.type,
   candidateValid:candidate.validation.valid===true,
   humanAuthorized:authorization.authorization.authorized===true,
   executionReady:readiness.readiness.ready===true,
   executionRequested:request.request.requested===true,
   requestAccepted:request.request.accepted===true,
   preflightPassed:preflight.preflight.passed===true,
   verificationPassed:verification.verification.verified===true,
   outcomeStatus:outcomePackage.outcome.status,
   actionPerformed:false,
   cycleCompleted:false
  }),
  authority:outcomePackage.authority,sourceStateMutated:false,persistencePerformed:false
 });
}
module.exports={createCPUDecisionCycleSummary};
