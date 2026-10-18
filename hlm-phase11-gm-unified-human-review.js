/* Mission 1278: combined provenance and unsaved local human GM review, without production side effects. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./hlm-phase11-gm-provenance-checkpoints'):null,typeof module==='object'&&module.exports?require('./hlm-phase11-gm-local-review-workspace'):null);if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMGMUnifiedHumanReview=api;})(typeof globalThis!=='undefined'?globalThis:this,function(provenanceDep,workspaceDep){
'use strict';
function create(ledger,sources,approved){
 const provenance=provenanceDep||(typeof globalThis!=='undefined'&&globalThis.HLMGMProvenanceCheckpoints);
 const notes=workspaceDep||(typeof globalThis!=='undefined'&&globalThis.HLMGMLocalReviewWorkspace);
 if(!provenance||!notes)throw Error('Review dependencies unavailable');
 const evidence=provenance.prepare(ledger,sources,approved),workspace=notes.create(ledger,approved);
 const byId=new Map(evidence.entries.map(e=>[e.taskId,e]));
 function inspect(taskId){
  if(!byId.has(taskId))throw Error('Unknown task');
  const entry=byId.get(taskId),note=workspace.snapshot(taskId);
  return Object.freeze({taskId,sourceRequirement:note.sourceRequirement,provenance:entry.provenance,missingEvidence:Object.freeze([...entry.missingEvidence]),checkpoints:Object.freeze(entry.checkpoints.map(c=>Object.freeze({...c}))),uncertainty:entry.uncertainty,note:note.note,reviewState:'human-note-unverified',independentVerification:'pending',eligibility:'unknown',saved:false});
 }
 return Object.freeze({
  inspect,list(){return Object.freeze(evidence.entries.map(e=>inspect(e.taskId)))},
  setNote(id,text){workspace.setNote(id,text);return inspect(id)},
  clearNote(id){workspace.clear(id);return inspect(id)},
  productionActivationAllowed:false,persistencePerformed:false,automaticTransactionsAllowed:false,automaticRosterChangesAllowed:false,finalDecisionMaker:'human-gm'
 });
}
return {create};
});