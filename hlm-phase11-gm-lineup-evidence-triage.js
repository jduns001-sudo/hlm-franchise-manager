/* Mission 1240: deterministic human GM evidence-verification checklist, never lineup advice. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./hlm-phase11-gm-lineup-evidence-matrix'):null);if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMGMLineupEvidenceTriage=api;})(typeof globalThis!=='undefined'?globalThis:this,function(matrixModule){
'use strict';
function triage(queue,state,focus,ids,approved){
 if(approved!==true)throw Error('Explicit human GM approval required');
 const source=matrixModule||(typeof globalThis!=='undefined'&&globalThis.HLMGMLineupEvidenceMatrix);
 if(!source||typeof source.inspect!=='function')throw Error('Lineup evidence matrix source unavailable');
 const matrix=source.inspect(queue,state,focus,ids,true);
 const checklist=matrix.evidenceGaps.map((gap,index)=>({
  id:gap.id,sequence:index+1,source:'selected staged controlled-team player evidence',
  affectedSelectedPlayers:gap.count,
  scope:gap.count===null?'not measurable from selected-player evidence':'selected players only',
  question:gap.id==='unknown-positions'?'Can the GM verify each missing source position?':gap.id==='missing-overalls'?'Can the GM verify each missing source overall rating?':gap.id==='unselected-roster'?'Which unselected controlled-team players should the GM inspect?':'Can the GM independently verify eligibility, availability and lineup slots?',
  status:'requires-human-verification',requiresGMDecision:true,executionAllowed:false
 }));
 return {kind:'experimental-gm-lineup-evidence-triage',focus,selectedPlayerCount:matrix.selectedPlayerCount,knownPositionPlayerCount:matrix.knownPositionPlayerCount,unknownPositionPlayerCount:matrix.unknownPositionPlayerCount,confidence:matrix.confidence,checklist,evidenceScope:matrix.evidenceScope,limitations:['Checklist sequence is evidence-verification order, not player or lineup ranking','No assumed roster completeness, lineup slots, eligibility or tactical suitability'],productionActivationAllowed:false,persistencePerformed:false,automaticTransactionsAllowed:false,automaticRosterChangesAllowed:false,gmApprovalStillRequired:true,finalDecisionMaker:'human-gm'};
}
return {triage};
});
