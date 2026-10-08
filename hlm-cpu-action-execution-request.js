'use strict';
const {createCPUActionExecutionReadiness}=require('./hlm-cpu-action-execution-readiness');

function createCPUActionExecutionRequest(state,teamId,options={}){
 const readinessPackage=createCPUActionExecutionReadiness(state,teamId,options);
 const requested=options.execute===true;
 const ready=readinessPackage.readiness.ready===true;
 const accepted=requested&&ready;
 return Object.freeze({
  kind:'cpu-action-execution-request-package',
  version:1,
  teamId:readinessPackage.teamId,
  readinessPackage,
  request:Object.freeze({
   kind:'cpu-action-execution-request',
   version:1,
   requested,
   accepted,
   ready,
   executionPerformed:false,
   sourceStateMutated:false,
   persistencePerformed:false
  }),
  validation:Object.freeze({
   valid:accepted,
   executionReady:ready,
   executionRequested:requested,
   humanAuthorized:readinessPackage.readiness.humanAuthorized===true,
   transactionVerified:readinessPackage.readiness.transactionVerified===true
  }),
  decisionStage:Object.freeze({...readinessPackage.decisionStage,stage:'act-execution-request',actExecutionRequested:accepted,actPerformed:false}),
  authority:Object.freeze({...readinessPackage.authority,cpuDecisionExecutionEnabled:false,humanAuthorizationRequired:true,automaticTransactions:false,automaticRosterChanges:false,automaticContractActions:false,automaticDraftActions:false}),
  sourceStateMutated:false,
  persistencePerformed:false
 });
}
module.exports={createCPUActionExecutionRequest};
