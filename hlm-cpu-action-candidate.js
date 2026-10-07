'use strict';
const {createCPUDecisionPrioritization}=require('./hlm-cpu-decision-prioritization');
const {createFranchiseActionTransaction,verifyFranchiseActionTransaction}=require('./hlm-franchise-action-transaction');
function list(v){return Array.isArray(v)?v:[];}
function createCPUActionCandidate(state,teamId,options={}){
 const prioritization=createCPUDecisionPrioritization(state,teamId,options.prioritization||{});
 const requestedId=options.priorityId==null?'':String(options.priorityId).trim();
 const priority=prioritization.priorities.find(x=>x.id===requestedId)||null;
 const validPriority=!!priority&&prioritization.validation.valid&&!prioritization.validation.invalidPriorityIds.includes(priority.id);
 const option=validPriority?prioritization.optionEvaluation.options.find(x=>x.id===priority.optionId)||null:null;
 const action=Object.freeze({kind:'cpu-action-candidate',version:1,teamId:prioritization.teamId,priorityId:requestedId,
  optionId:option?.id??null,problemId:option?.problemId??null,type:option?.type??null,area:option?.area??null,
  candidateOnly:true,sourceStateMutated:false,persistencePerformed:false});
 const transaction=validPriority?createFranchiseActionTransaction(state,action):null;
 const verification=transaction?verifyFranchiseActionTransaction(transaction):null;
 return Object.freeze({kind:'cpu-action-candidate-package',version:1,teamId:prioritization.teamId,prioritization,action,
  validation:Object.freeze({valid:validPriority&&verification?.verified===true,priorityFound:!!priority,priorityValid:validPriority,transactionVerified:verification?.verified===true}),
  transaction,verification,
  decisionStage:Object.freeze({stage:'act',assessmentPerformed:true,problemIdentificationPerformed:true,evaluateOptionsPerformed:true,prioritizePerformed:true,actCandidateRepresented:true,actPerformed:false}),
  authority:Object.freeze({...prioritization.authority,cpuDecisionExecutionEnabled:false,humanAuthorizationRequired:true,automaticTransactions:false,automaticRosterChanges:false,automaticContractActions:false,automaticDraftActions:false}),
  sourceStateMutated:false,persistencePerformed:false});
}
module.exports={createCPUActionCandidate};
