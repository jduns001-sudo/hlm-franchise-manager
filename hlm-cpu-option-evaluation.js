'use strict';
const {createCPUProblemIdentification}=require('./hlm-cpu-problem-identification');
const {DECISION_AREAS}=require('./hlm-cpu-organization-intelligence');
const OPTION_TYPES=Object.freeze(['roster','lines','contracts','trades','draft','free-agency','prospects','cap','wait']);
function list(v){return Array.isArray(v)?v:[];}
function createCPUOptionEvaluation(state,teamId,options={}){
 const identification=createCPUProblemIdentification(state,teamId,options.identification||{});
 const duplicateProblemIds=new Set(identification.validation.duplicateProblemIds);\n const knownProblems=new Set(identification.problems.filter(p=>p.valid.category&&p.valid.severity&&!duplicateProblemIds.has(p.id)).map(p=>p.id));
 const candidates=Object.freeze(list(options.options).map((o,index)=>{
  const suppliedId=o?.id==null?'':String(o.id).trim();const id=suppliedId||('option-'+(index+1));
  const problemId=o?.problemId==null?'':String(o.problemId).trim();
  const type=o?.type??null;
  const area=o?.area??(type==='wait'?null:type);
  const evidence=Object.freeze(list(o?.evidence).map(x=>Object.freeze({...x})));
  return Object.freeze({id,problemId,type,area,summary:o?.summary??null,evidence,
   validity:Object.freeze({problem:knownProblems.has(problemId),type:OPTION_TYPES.includes(type),area:area===null||DECISION_AREAS.includes(area)})});
 }));
 const ids=candidates.map(x=>x.id);const duplicateIds=new Set(ids.filter((id,i)=>ids.indexOf(id)!==i));
 const valid=identification.validation.valid&&candidates.every(x=>x.validity.problem&&x.validity.type&&x.validity.area&&!duplicateIds.has(x.id));
 return Object.freeze({kind:'cpu-option-evaluation',version:1,teamId:identification.teamId,problemIdentification:identification,
  optionTypes:OPTION_TYPES,decisionAreas:DECISION_AREAS,options:candidates,
  validation:Object.freeze({valid,invalidOptionIds:Object.freeze(candidates.filter(x=>!x.validity.problem||!x.validity.type||!x.validity.area||duplicateIds.has(x.id)).map(x=>x.id)),duplicateOptionIds:Object.freeze([...duplicateIds])}),
  evaluation:Object.freeze({candidateOptionsRepresented:true,scoringPerformed:false,rankingPerformed:false,prioritizationPerformed:false,selectionPerformed:false}),
  decisionStage:Object.freeze({stage:'evaluate-options',assessmentPerformed:true,problemIdentificationPerformed:true,evaluateOptionsPerformed:true,prioritizePerformed:false,actPerformed:false}),
  authority:Object.freeze({...identification.authority,cpuDecisionExecutionEnabled:false,automaticTransactions:false,automaticRosterChanges:false,automaticContractActions:false,automaticDraftActions:false}),
  sourceStateMutated:identification.sourceStateMutated,persistencePerformed:false});
}
module.exports={OPTION_TYPES,createCPUOptionEvaluation};
