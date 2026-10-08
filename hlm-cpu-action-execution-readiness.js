'use strict';
const {authorizeCPUActionCandidate}=require('./hlm-cpu-action-authorization');

function createCPUActionExecutionReadiness(state,teamId,options={}){
 const authorizationPackage=authorizeCPUActionCandidate(state,teamId,options);
 const authorized=authorizationPackage.authorization.authorized===true;
 const transactionVerified=authorizationPackage.candidate.verification?.verified===true;
 const ready=authorized&&transactionVerified;
 return Object.freeze({
  kind:'cpu-action-execution-readiness-package',
  version:1,
  teamId:authorizationPackage.teamId,
  authorizationPackage,
  readiness:Object.freeze({
   ready,
   candidateValid:authorizationPackage.validation.candidateValid===true,
   humanAuthorized:authorized,
   transactionVerified,
   executionRequested:false,
   executionPerformed:false
  }),
  decisionStage:Object.freeze({...authorizationPackage.decisionStage,stage:'act-execution-readiness',actExecutionReady:ready,actPerformed:false}),
  authority:Object.freeze({...authorizationPackage.authority,cpuDecisionExecutionEnabled:false,humanAuthorizationRequired:true,automaticTransactions:false,automaticRosterChanges:false,automaticContractActions:false,automaticDraftActions:false}),
  sourceStateMutated:false,
  persistencePerformed:false
 });
}
module.exports={createCPUActionExecutionReadiness};
