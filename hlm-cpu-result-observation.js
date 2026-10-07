'use strict';
const {createCPUActionCandidate}=require('./hlm-cpu-action-candidate');
const OBSERVATION_OUTCOMES=Object.freeze(['positive','neutral','negative','pending']);
function list(v){return Array.isArray(v)?v:[];}
function createCPUResultObservation(state,teamId,options={}){
 const actionPackage=createCPUActionCandidate(state,teamId,options.action||{});
 const actionValid=actionPackage.validation.valid===true;
 const observations=Object.freeze(list(options.observations).map((o,index)=>{
  const suppliedId=o?.id==null?'':String(o.id).trim();const id=suppliedId||('observation-'+(index+1));
  const optionId=o?.optionId==null?'':String(o.optionId).trim();
  const outcome=o?.outcome??null;
  return Object.freeze({id,optionId,outcome,evidence:o?.evidence??null,
   validity:Object.freeze({action:actionValid&&optionId===actionPackage.action.optionId,outcome:OBSERVATION_OUTCOMES.includes(outcome)})});
 }));
 const ids=observations.map(x=>x.id);const duplicateIds=new Set(ids.filter((id,i)=>ids.indexOf(id)!==i));
 const valid=actionValid&&observations.every(x=>x.validity.action&&x.validity.outcome&&!duplicateIds.has(x.id));
 return Object.freeze({kind:'cpu-result-observation',version:1,teamId:actionPackage.teamId,actionPackage,observationOutcomes:OBSERVATION_OUTCOMES,observations,
  validation:Object.freeze({valid,actionValid,invalidObservationIds:Object.freeze(observations.filter(x=>!x.validity.action||!x.validity.outcome||duplicateIds.has(x.id)).map(x=>x.id)),duplicateObservationIds:Object.freeze([...duplicateIds])}),
  observation:Object.freeze({resultsRepresented:true,outcomeSimulationPerformed:false,beliefUpdatePerformed:false,replanningPerformed:false}),
  decisionStage:Object.freeze({stage:'observe-results',assessmentPerformed:true,problemIdentificationPerformed:true,evaluateOptionsPerformed:true,prioritizePerformed:true,actCandidateRepresented:true,actPerformed:false,observeResultsPerformed:true,updateBeliefsPerformed:false,planAgainPerformed:false}),
  authority:Object.freeze({...actionPackage.authority,cpuDecisionExecutionEnabled:false,automaticTransactions:false,automaticRosterChanges:false,automaticContractActions:false,automaticDraftActions:false}),
  sourceStateMutated:false,persistencePerformed:false});
}
module.exports={OBSERVATION_OUTCOMES,createCPUResultObservation};
