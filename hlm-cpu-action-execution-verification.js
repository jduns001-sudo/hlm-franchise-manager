'use strict';
const {createCPUActionExecutionPreflight}=require('./hlm-cpu-action-execution-preflight');
function verifyCPUActionExecutionPackage(state,teamId,options={}){
 const preflightPackage=createCPUActionExecutionPreflight(state,teamId,options);
 const checks=Object.freeze({
  preflightPassed:preflightPackage.preflight.passed===true,
  requestAccepted:preflightPackage.preflight.requestAccepted===true,
  humanAuthorized:preflightPackage.preflight.humanAuthorized===true,
  transactionVerified:preflightPackage.preflight.transactionVerified===true,
  executorDisabled:preflightPackage.preflight.executorEnabled===false,
  noExecution:preflightPackage.preflight.executionPerformed===false,
  noMutation:preflightPackage.sourceStateMutated===false,
  noPersistence:preflightPackage.persistencePerformed===false
 });
 const verified=Object.values(checks).every(Boolean);
 return Object.freeze({kind:'cpu-action-execution-verification-package',version:1,teamId:preflightPackage.teamId,preflightPackage,checks,verification:Object.freeze({verified,executionPerformed:false}),authority:preflightPackage.authority,sourceStateMutated:false,persistencePerformed:false});
}
module.exports={verifyCPUActionExecutionPackage};
