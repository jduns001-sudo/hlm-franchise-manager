/* Mission 1243: bounded GM lineup evidence review brief, without assumed resolutions. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./hlm-phase11-gm-lineup-evidence-readiness'):null);if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMGMLineupGateReviewBrief=api;})(typeof globalThis!=='undefined'?globalThis:this,function(readinessModule){
'use strict';
function prepare(queue,state,focus,ids,approved){
 if(approved!==true)throw Error('Explicit human GM approval required');
 const source=readinessModule||(typeof globalThis!=='undefined'&&globalThis.HLMGMLineupEvidenceReadiness);
 if(!source||typeof source.assess!=='function')throw Error('Lineup evidence readiness source unavailable');
 const readiness=source.assess(queue,state,focus,ids,true);
 const items=readiness.gates.map(g=>({
  gateId:g.id,source:g.source,sequence:g.sequence,evidenceState:g.evidenceState,
  affectedSelectedPlayers:g.affectedSelectedPlayers,question:g.verificationQuestion,
  reviewStatus:'unresolved',humanVerificationRequired:true,executionAllowed:false
 }));
 return {kind:'experimental-gm-lineup-gate-review-brief',focus,selectedPlayerCount:readiness.selectedPlayerCount,
  totalOpenGates:items.length,missingInSelectedSource:items.filter(x=>x.evidenceState==='missing-in-selected-source').length,
  notAssessed:items.filter(x=>x.evidenceState==='not-assessed').length,items,
  scopeNotice:'Counts describe verification gates, not confirmed ineligible players or roster vacancies',
  evidenceReadiness:'not-established',lineupEligibility:'unknown',lineupAvailability:'unknown',
  confidence:readiness.confidence,evidenceScope:readiness.evidenceScope,
  productionActivationAllowed:false,persistencePerformed:false,automaticTransactionsAllowed:false,
  automaticRosterChangesAllowed:false,gmApprovalStillRequired:true,finalDecisionMaker:'human-gm'};
}
return {prepare};
});
