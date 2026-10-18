/* Mission 1283: privacy-safe deterministic evidence handoff, no note content. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMGMPrivateHandoff=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function create(workbench){
 if(!workbench||typeof workbench.overview!=='function'||typeof workbench.inspect!=='function')throw Error('Review workbench required');
 function summary(){
  const view=workbench.overview();
  return Object.freeze({kind:'experimental-human-gm-evidence-handoff',allTasks:view.allTasks,matchingTasks:view.matchingTasks,missingEvidenceItems:view.missingEvidenceItems,priorityCounts:Object.freeze({...view.priorityCounts}),unsavedNoteCount:view.unsavedNotes,independentVerification:'pending',verified:0,approved:0,productionActivationAllowed:false,automaticTransactionsAllowed:false,containsNoteContents:false,containsPlayerIdentifiers:false});
 }
 function serialize(){return JSON.stringify(summary());}
 function checkpoints(){
  return Object.freeze(['Review source provenance independently','Resolve outstanding evidence gaps with authoritative sources','Require explicit human GM review before any action']);
 }
 return Object.freeze({summary,serialize,checkpoints,persistencePerformed:false,productionActivationAllowed:false,automaticTransactionsAllowed:false,finalDecisionMaker:'human-gm'});
}
return {create};
});