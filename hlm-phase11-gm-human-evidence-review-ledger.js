/* Mission 1274: deterministic, read-only human GM evidence review ledger. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMGMHumanEvidenceReviewLedger=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function build(packetBundle,reviewNotes,approved){
 if(approved!==true)throw Error('Explicit human GM approval required');
 if(!packetBundle||packetBundle.kind!=='experimental-gm-human-session-handoff-packets'||!Array.isArray(packetBundle.packets))throw Error('Valid handoff packets required');
 if(!Array.isArray(reviewNotes))throw Error('Review notes must be an array');
 const keys=new Set(), notes=new Map();
 for(const note of reviewNotes){
  if(!note||typeof note.taskId!=='string'||!note.taskId.trim()||keys.has(note.taskId))throw Error('Duplicate or invalid review task');
  keys.add(note.taskId);
  if(typeof note.comment!=='string'||note.comment.length>2000)throw Error('Invalid human note');
  notes.set(note.taskId,note.comment);
 }
 const checks=packetBundle.packets.flatMap(p=>p.checks||[]);
 const known=new Set(checks.map(c=>c.taskId));
 for(const key of keys)if(!known.has(key))throw Error('Review note references unknown task');
 const entries=checks.map(c=>Object.freeze({taskId:c.taskId,sessionNumber:c.sessionNumber,gateId:c.gateId,sourceRequirement:c.sourceRequirement,remainingGap:c.remainingGap,uncertainty:c.uncertainty,reviewNote:notes.get(c.taskId)||'',reviewState:notes.has(c.taskId)?'human-note-recorded-unverified':'awaiting-human-note',sourceVerification:'not-performed',independentVerification:'pending',eligibility:'unknown'}));
 return Object.freeze({kind:'experimental-gm-human-evidence-review-ledger',entries,entryCount:entries.length,notedCount:notes.size,verifiedCount:0,readiness:'blocked-pending-independent-verification',confidence:'not-established',productionActivationAllowed:false,persistencePerformed:false,automaticTransactionsAllowed:false,automaticRosterChangesAllowed:false,finalDecisionMaker:'human-gm',warning:'Human notes do not verify sources, satisfy gates, or authorize transactions.'});
}
return {build};
});