/* Mission 1277: volatile human GM review notes; no storage, verification, or transaction execution. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMGMLocalReviewWorkspace=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function create(ledger,approved){
 if(approved!==true)throw Error('Explicit human GM review authorization required');
 if(!ledger||ledger.kind!=='experimental-gm-human-evidence-review-ledger'||!Array.isArray(ledger.entries))throw Error('Valid human review ledger required');
 const tasks=new Map();
 for(const e of ledger.entries){if(!e||typeof e.taskId!=='string'||!e.taskId.trim()||tasks.has(e.taskId))throw Error('Invalid or duplicate task');tasks.set(e.taskId,{note:'',sourceRequirement:String(e.sourceRequirement||'Unspecified source requirement')});}
 const get=id=>{if(!tasks.has(id))throw Error('Unknown task');return tasks.get(id)};
 return Object.freeze({
  setNote(id,note){if(typeof note!=='string'||note.length>2000)throw Error('Note must be at most 2000 characters');get(id).note=note;return this.snapshot(id)},
  snapshot(id){const v=get(id);return Object.freeze({taskId:id,note:v.note,sourceRequirement:v.sourceRequirement,reviewState:'unverified-human-note',independentVerification:'pending',eligibility:'unknown',saved:false});},
  list(){return Object.freeze([...tasks.keys()].map(id=>this.snapshot(id)))},
  clear(id){get(id).note='';return this.snapshot(id)},
  productionActivationAllowed:false,persistencePerformed:false,automaticTransactionsAllowed:false,automaticRosterChangesAllowed:false,finalDecisionMaker:'human-gm'
 });
}
return {create};
});