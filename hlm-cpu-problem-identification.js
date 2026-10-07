'use strict';
const {ASSESSMENT_FACTORS,createCPUOrganizationalAssessment}=require('./hlm-cpu-organizational-assessment');
const PROBLEM_CATEGORIES=ASSESSMENT_FACTORS;
const PROBLEM_SEVERITIES=Object.freeze(['low','medium','high','critical']);
function list(v){return Array.isArray(v)?v:[];}
function createCPUProblemIdentification(state,teamId,options={}){
 const assessment=createCPUOrganizationalAssessment(state,teamId,options.assessment||{});
 const problems=Object.freeze(list(options.problems).map((p,index)=>{
  const category=p?.category??null,severity=p?.severity??null;
  return Object.freeze({id:String(p?.id??('problem-'+(index+1))),category,severity,summary:p?.summary??null,evidence:Object.freeze(list(p?.evidence).map(x=>Object.freeze({...x}))),
   valid:Object.freeze({category:PROBLEM_CATEGORIES.includes(category),severity:severity===null||PROBLEM_SEVERITIES.includes(severity)})});
 }));
 const ids=problems.map(p=>p.id);const duplicateIds=new Set(ids.filter((id,i)=>!id||ids.indexOf(id)!==i));
 const valid=problems.every(p=>p.valid.category&&p.valid.severity&&!duplicateIds.has(p.id));
 return Object.freeze({kind:'cpu-problem-identification',version:1,teamId:assessment.teamId,assessment,
  categories:PROBLEM_CATEGORIES,severities:PROBLEM_SEVERITIES,problems,
  validation:Object.freeze({valid,invalidProblemIds:Object.freeze(problems.filter(p=>!p.valid.category||!p.valid.severity||duplicateIds.has(p.id)).map(p=>p.id)),duplicateProblemIds:Object.freeze([...duplicateIds])}),
  decisionStage:Object.freeze({stage:'identify-problems',assessmentPerformed:true,problemIdentificationPerformed:true,evaluateOptionsPerformed:false,prioritizePerformed:false,actPerformed:false}),
  authority:Object.freeze({...assessment.authority,cpuDecisionExecutionEnabled:false,automaticTransactions:false,automaticRosterChanges:false,automaticContractActions:false,automaticDraftActions:false}),
  sourceStateMutated:assessment.sourceStateMutated,persistencePerformed:false});
}
module.exports={PROBLEM_CATEGORIES,PROBLEM_SEVERITIES,createCPUProblemIdentification};
