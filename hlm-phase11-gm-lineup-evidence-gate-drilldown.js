/* Mission 1242: focused, source-bounded human GM evidence gate drilldown. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./hlm-phase11-gm-lineup-evidence-readiness'):null);if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMGMLineupEvidenceGateDrilldown=api;})(typeof globalThis!=='undefined'?globalThis:this,function(readinessModule){
'use strict';
function inspectGate(queue,state,focus,ids,gateId,approved){
 if(approved!==true)throw Error('Explicit human GM approval required');
 const source=readinessModule||(typeof globalThis!=='undefined'&&globalThis.HLMGMLineupEvidenceReadiness);
 if(!source||typeof source.assess!=='function')throw Error('Lineup evidence readiness source unavailable');
 const readiness=source.assess(queue,state,focus,ids,true);
 if(typeof gateId!=='string'||!gateId)throw Error('Explicit evidence gate selection required');
 const gate=readiness.gates.find(g=>g.id===gateId);
 if(!gate)throw Error('Selected evidence gate not present in staged source');
 return {kind:'experimental-gm-lineup-evidence-gate-drilldown',focus,gateId:gate.id,
  selectedPlayerCount:readiness.selectedPlayerCount,source:gate.source,affectedSelectedPlayers:gate.affectedSelectedPlayers,
  evidenceState:gate.evidenceState,verificationQuestion:gate.verificationQuestion,
  interpretation:gate.affectedSelectedPlayers===null?'Selected-player source cannot quantify this gate':'Count refers only to selected staged controlled-team players',
  nextHumanAction:'Verify source evidence independently before any lineup decision',
  lineupEligibility:'unknown',lineupAvailability:'unknown',evidenceReadiness:'not-established',
  confidence:readiness.confidence,evidenceScope:readiness.evidenceScope,
  requiresGMDecision:true,executionAllowed:false,productionActivationAllowed:false,
  persistencePerformed:false,automaticTransactionsAllowed:false,automaticRosterChangesAllowed:false,
  gmApprovalStillRequired:true,finalDecisionMaker:'human-gm'};
}
return {inspectGate};
});
