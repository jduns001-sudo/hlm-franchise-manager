'use strict';
const {createCPUActionCandidate}=require('./hlm-cpu-action-candidate');

function authorizeCPUActionCandidate(state,teamId,options={}){
 const candidate=createCPUActionCandidate(state,teamId,options);
 const requested=options.authorized===true;
 const candidateValid=candidate.validation.valid===true&&candidate.verification?.verified===true;
 const authorized=requested&&candidateValid;
 const authorization=Object.freeze({
  kind:'cpu-action-authorization',
  version:1,
  teamId:candidate.teamId,
  priorityId:candidate.action.priorityId,
  optionId:candidate.action.optionId,
  requested,
  authorized,
  candidateValid,
  humanAuthorizationRequired:true,
  humanAuthorizationProvided:requested,
  executionEnabled:false,
  sourceStateMutated:false,
  persistencePerformed:false
 });
 return Object.freeze({
  kind:'cpu-action-authorization-package',
  version:1,
  teamId:candidate.teamId,
  candidate,
  authorization,
  validation:Object.freeze({
   valid:authorized,
   candidateValid,
   authorizationRequested:requested,
   transactionVerified:candidate.verification?.verified===true
  }),
  decisionStage:Object.freeze({...candidate.decisionStage,stage:'act-authorization',actAuthorized:authorized,actPerformed:false}),
  authority:Object.freeze({...candidate.authority,cpuDecisionExecutionEnabled:false,humanAuthorizationRequired:true,automaticTransactions:false,automaticRosterChanges:false,automaticContractActions:false,automaticDraftActions:false}),
  sourceStateMutated:false,
  persistencePerformed:false
 });
}
module.exports={authorizeCPUActionCandidate};
