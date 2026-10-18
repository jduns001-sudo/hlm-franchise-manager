/* Mission 1284: explicit preparation checklist, never independent verification or approval. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMGMReadinessChecklist=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const steps=Object.freeze([{id:'review-scope',label:'Review scope and task counts'},{id:'source-inventory',label:'Prepare independent source inventory'},{id:'gap-triage',label:'Triage unresolved evidence gaps'},{id:'handoff-review',label:'Review privacy-safe handoff summary'}]);
function create(handoff){
 if(!handoff||typeof handoff.summary!=='function')throw Error('Privacy-safe handoff required');
 const completed=new Set();
 function snapshot(){
  const s=handoff.summary(),items=steps.map(step=>Object.freeze({...step,prepared:completed.has(step.id)})),unresolved=[];
  if(s.missingEvidenceItems>0)unresolved.push('Outstanding evidence gaps require independent source verification');
  unresolved.push('Independent verification remains pending');
  unresolved.push('Human GM approval is not recorded');
  return Object.freeze({kind:'experimental-human-gm-preparation-checklist',steps:Object.freeze(items),preparedCount:completed.size,totalSteps:steps.length,preparationComplete:completed.size===steps.length,unresolved:Object.freeze(unresolved),allTasks:s.allTasks,missingEvidenceItems:s.missingEvidenceItems,unsavedNoteCount:s.unsavedNoteCount,independentVerification:'pending',verified:0,approved:0,productionActivationAllowed:false,containsNoteContents:false});
 }
 function setPrepared(id,value){if(!steps.some(x=>x.id===id)||typeof value!=='boolean')throw Error('Invalid checklist update');if(value)completed.add(id);else completed.delete(id);return snapshot()}
 function serialize(){return JSON.stringify(snapshot())}
 return Object.freeze({snapshot,setPrepared,serialize,persistencePerformed:false,productionActivationAllowed:false,automaticTransactionsAllowed:false,finalDecisionMaker:'human-gm'});
}
return {create};
});