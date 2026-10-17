/* Mission 1245: in-memory human verification handoff for two unresolved lineup gates. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./hlm-phase11-gm-lineup-gate-evidence-comparison'):null);if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMGMLineupGateVerificationHandoff=api;})(typeof globalThis!=='undefined'?globalThis:this,function(comparisonModule){
'use strict';
function prepare(queue,state,focus,ids,leftId,rightId,approved){
 if(approved!==true)throw Error('Explicit human GM approval required');
 const source=comparisonModule||(typeof globalThis!=='undefined'&&globalThis.HLMGMLineupGateEvidenceComparison);
 if(!source||typeof source.compare!=='function')throw Error('GM evidence comparison source unavailable');
 const comparison=source.compare(queue,state,focus,ids,leftId,rightId,true);
 const tasks=[comparison.left,comparison.right].map((gate,index)=>({
  sequence:index+1,gateId:gate.gateId,source:gate.source,evidenceState:gate.evidenceState,
  affectedSelectedPlayers:gate.affectedSelectedPlayers,
  humanQuestion:gate.verificationQuestion,
  evidenceNeeded:gate.evidenceState==='missing-in-selected-source'?'Verify missing fields against authoritative player source before any conclusion':'Obtain an independent eligibility or roster assessment; no source-based count can be inferred',
  verificationStatus:'pending-human-review',canMarkResolved:false,executionAllowed:false
 }));
 return {kind:'experimental-gm-lineup-gate-verification-handoff',focus,selectedPlayerCount:comparison.selectedPlayerCount,
  tasks,openVerificationQuestions:tasks.length,sourceCountScope:comparison.affectedCountComparison,
  warning:'This is a human review handoff, not an eligibility assessment, resolved gate, lineup assignment or action authorization',
  lineupEligibility:'unknown',lineupAvailability:'unknown',evidenceReadiness:'not-established',
  productionActivationAllowed:false,persistencePerformed:false,automaticTransactionsAllowed:false,
  automaticRosterChangesAllowed:false,gmApprovalStillRequired:true,finalDecisionMaker:'human-gm'};
}
return {prepare};
});
