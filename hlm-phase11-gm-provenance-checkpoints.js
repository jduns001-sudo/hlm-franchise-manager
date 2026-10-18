/* Mission 1275: source provenance and independent human review preparation, never automatic verification. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMGMProvenanceCheckpoints=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function prepare(ledger,sources,approved){
 if(approved!==true)throw Error('Explicit human GM approval required');
 if(!ledger||ledger.kind!=='experimental-gm-human-evidence-review-ledger'||!Array.isArray(ledger.entries))throw Error('Valid human review ledger required');
 if(!Array.isArray(sources))throw Error('Sources must be an array');
 const ids=new Set(ledger.entries.map(e=>e.taskId)),seen=new Set(),byId=new Map();
 for(const s of sources){
  if(!s||typeof s.taskId!=='string'||!ids.has(s.taskId)||seen.has(s.taskId))throw Error('Unknown or duplicate source task');
  seen.add(s.taskId);
  for(const key of ['sourceId','sourceLocation','sourceDate','reviewerNote'])if(typeof s[key]!=='string'||s[key].length>1000)throw Error('Invalid provenance field: '+key);
  byId.set(s.taskId,s);
 }
 const entries=ledger.entries.map(e=>{
  const s=byId.get(e.taskId);
  const provenance=s?{sourceId:s.sourceId,sourceLocation:s.sourceLocation,sourceDate:s.sourceDate,reviewerNote:s.reviewerNote}:null;
  const missing=[...(!s||!s.sourceId.trim()?['source identifier']:[]),...(!s||!s.sourceLocation.trim()?['source location']:[]),...(!s||!s.sourceDate.trim()?['source date']:[]),'independent authenticity verification','human GM evidence decision'];
  return {taskId:e.taskId,gateId:e.gateId,sourceRequirement:e.sourceRequirement,provenance,missingEvidence:missing,uncertainty:'unverified-source-provenance',checkpoints:[{id:'provenance',state:'pending-independent-review'},{id:'authenticity',state:'pending-independent-review'},{id:'human-gm-decision',state:'pending-human-gm'}],eligibility:'unknown'};
 });
 return {kind:'experimental-gm-provenance-checkpoints',entries,entryCount:entries.length,verifiedCount:0,readiness:'blocked-pending-independent-verification',productionActivationAllowed:false,persistencePerformed:false,automaticTransactionsAllowed:false,automaticRosterChangesAllowed:false,finalDecisionMaker:'human-gm',warning:'Source metadata is unverified. No checkpoint is completed and no eligibility or GM action is authorized.'};
}
return {prepare};
});