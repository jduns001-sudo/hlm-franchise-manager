'use strict';
const {createCPUActionExecutionRequest}=require('./hlm-cpu-action-execution-request');

function createCPUActionExecutionPreflight(state,teamId,options={}){
 const requestPackage=createCPUActionExecutionRequest(state,teamId,options);
 const requestAccepted=requestPackage.request.accepted===true;
 const executionReady=requestPackage.validation.executionReady===true;
 const humanAuthorized=requestPackage.validation.humanAuthorized===true;
 const transactionVerified=requestPackage.validation.transactionVerified===true;
 const passed=requestAccepted&&executionReady&&humanAuthorized&&transactionVerified;
 return Object.freeze({
  kind:'cpu-action-execution-preflight-package',
  version:1,
  teamId:requestPackage.teamId,
  requestPackage,
  preflight:Object.freeze({
   passed,
   requestAccepted,
   executionReady,
   humanAuthorized,
   transactionVerified,
   executorEnabled:false,
   executionPerformed:false
  }),
  decisionStage:Object.freeze({...requestPackage.decisionStage,stage:'act-execution-preflight',actExecutionPreflightPassed:passed,actPerformed:false}),
  authority:Object.freeze({...requestPackage.authority,cpuDecisionExecutionEnabled:false,humanAuthorizationRequired:true,automaticTransactions:false,automaticRosterChanges:false,automaticContractActions:false,automaticDraftActions:false}),
  sourceStateMutated:false,
  persistencePerformed:false
 });
}
module.exports={createCPUActionExecutionPreflight};
