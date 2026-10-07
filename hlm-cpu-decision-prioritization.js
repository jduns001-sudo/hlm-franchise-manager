'use strict';
const {createCPUOptionEvaluation}=require('./hlm-cpu-option-evaluation');
const PRIORITY_TIERS=Object.freeze(['low','medium','high','critical']);
function list(v){return Array.isArray(v)?v:[];}
function createCPUDecisionPrioritization(state,teamId,options={}){
 const evaluation=createCPUOptionEvaluation(state,teamId,options.evaluation||{});
 const duplicateOptionIds=new Set(evaluation.validation.duplicateOptionIds);
 const knownOptions=new Set(evaluation.options.filter(o=>o.validity.problem&&o.validity.type&&o.validity.area&&!duplicateOptionIds.has(o.id)).map(o=>o.id));
 const priorities=Object.freeze(list(options.priorities).map((p,index)=>{
  const suppliedId=p?.id==null?'':String(p.id).trim();const id=suppliedId||('priority-'+(index+1));
  const optionId=p?.optionId==null?'':String(p.optionId).trim();
  const tier=p?.tier??null;const order=Number.isInteger(p?.order)&&p.order>0?p.order:null;
  return Object.freeze({id,optionId,tier,order,rationale:p?.rationale??null,
   validity:Object.freeze({option:knownOptions.has(optionId),tier:PRIORITY_TIERS.includes(tier),order:order!==null})});
 }));
 const ids=priorities.map(x=>x.id);const duplicateIds=new Set(ids.filter((id,i)=>ids.indexOf(id)!==i));
 const orders=priorities.map(x=>x.order).filter(x=>x!==null);const duplicateOrders=new Set(orders.filter((v,i)=>orders.indexOf(v)!==i));
 const optionIds=priorities.map(x=>x.optionId);const duplicateOptionIds=new Set(optionIds.filter((v,i)=>v&&optionIds.indexOf(v)!==i));
 const valid=evaluation.validation.valid&&priorities.every(x=>x.validity.option&&x.validity.tier&&x.validity.order&&!duplicateIds.has(x.id)&&!duplicateOrders.has(x.order)&&!duplicateOptionIds.has(x.optionId));
 return Object.freeze({kind:'cpu-decision-prioritization',version:1,teamId:evaluation.teamId,optionEvaluation:evaluation,
  priorityTiers:PRIORITY_TIERS,priorities,
  validation:Object.freeze({valid,invalidPriorityIds:Object.freeze(priorities.filter(x=>!x.validity.option||!x.validity.tier||!x.validity.order||duplicateIds.has(x.id)||duplicateOrders.has(x.order)||duplicateOptionIds.has(x.optionId)).map(x=>x.id)),duplicatePriorityIds:Object.freeze([...duplicateIds]),duplicateOrders:Object.freeze([...duplicateOrders]),duplicateOptionIds:Object.freeze([...duplicateOptionIds])}),
  prioritization:Object.freeze({prioritiesRepresented:true,rankingPerformed:true,selectionPerformed:false,actionPerformed:false}),
  decisionStage:Object.freeze({stage:'prioritize',assessmentPerformed:true,problemIdentificationPerformed:true,evaluateOptionsPerformed:true,prioritizePerformed:true,actPerformed:false}),
  authority:Object.freeze({...evaluation.authority,cpuDecisionExecutionEnabled:false,automaticTransactions:false,automaticRosterChanges:false,automaticContractActions:false,automaticDraftActions:false}),
  sourceStateMutated:evaluation.sourceStateMutated,persistencePerformed:false});
}
module.exports={PRIORITY_TIERS,createCPUDecisionPrioritization};
