/* Mission 1241: bounded evidence readiness gates; never assert lineup eligibility. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./hlm-phase11-gm-lineup-evidence-triage'):null);if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMGMLineupEvidenceReadiness=api;})(typeof globalThis!=='undefined'?globalThis:this,function(triageModule){
'use strict';
function assess(queue,state,focus,ids,approved){
 if(approved!==true)throw Error('Explicit human GM approval required');
 const source=triageModule||(typeof globalThis!=='undefined'&&globalThis.HLMGMLineupEvidenceTriage);
 if(!source||typeof source.triage!=='function')throw Error('GM evidence triage source unavailable');
 const triage=source.triage(queue,state,focus,ids,true);
 const gates=triage.checklist.map(item=>({
  id:item.id,sequence:item.sequence,source:item.source,
  affectedSelectedPlayers:item.affectedSelectedPlayers,
  evidenceState:item.affectedSelectedPlayers===null?'not-assessed':'missing-in-selected-source',
  verificationQuestion:item.question,
  blocksLineupReadiness:true,requiresGMDecision:true,executionAllowed:false
 }));
 return {kind:'experimental-gm-lineup-evidence-readiness',focus,selectedPlayerCount:triage.selectedPlayerCount,
  evidenceReadiness:'not-established',lineupEligibility:'unknown',lineupAvailability:'unknown',
  selectedSourceCompleteness:triage.unknownPositionPlayerCount===0?'position-fields-observed':'missing-position-fields',
  gates,confidence:triage.confidence,evidenceScope:triage.evidenceScope,
  limitations:['Even complete selected fields cannot establish lineup eligibility','Gates are verification prompts, not proof of ineligibility or player rankings'],
  productionActivationAllowed:false,persistencePerformed:false,automaticTransactionsAllowed:false,
  automaticRosterChangesAllowed:false,gmApprovalStillRequired:true,finalDecisionMaker:'human-gm'};
}
return {assess};
});
