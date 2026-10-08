'use strict';
const {verifyCPUActionExecutionPackage}=require('./hlm-cpu-action-execution-verification');
function assessCPUActionOutcome(state,teamId,options={}){
 const verificationPackage=verifyCPUActionExecutionPackage(state,teamId,options);
 const verified=verificationPackage.verification.verified===true;
 const performed=verificationPackage.verification.executionPerformed===true;
 const status=performed?'executed':verified?'awaiting-execution':'blocked';
 return Object.freeze({
  kind:'cpu-action-outcome-assessment-package',version:1,teamId:verificationPackage.teamId,
  verificationPackage,
  outcome:Object.freeze({status,executionRequestVerified:verified,actionPerformed:performed,
   completed:false,resultsAvailable:false,feedbackRecorded:false}),
  decisionStage:Object.freeze({stage:'assess-outcome',actPerformed:performed,outcomeAssessed:true,cycleCompleted:false}),
  authority:verificationPackage.authority,sourceStateMutated:false,persistencePerformed:false
 });
}
module.exports={assessCPUActionOutcome};
