/* Mission 1239: source-only selected-player evidence matrix. No inferred assignments. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./hlm-phase11-gm-lineup-planning'):null);if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMGMLineupEvidenceMatrix=api;})(typeof globalThis!=='undefined'?globalThis:this,function(planningModule){
'use strict';
function inspect(queue,state,focus,ids,approved){
 if(approved!==true)throw Error('Explicit human GM approval required');
 const source=planningModule||(typeof globalThis!=='undefined'&&globalThis.HLMGMLineupPlanning);
 if(!source||typeof source.plan!=='function')throw Error('GM planning source unavailable');
 const planning=source.plan(queue,state,focus,ids,true);
 const players=planning.coverage.coverage;
 const rows=players.map(item=>({
  position:item.position,selectedCount:item.selectedCount,
  source:'selected staged controlled-team players',
  positionKnown:item.position!=='unknown',
  rosterDepthKnown:false,lineupEligibilityKnown:false,
  interpretation:item.position==='unknown'?'Position evidence missing; no slot inferred':'Observed source position only; not a lineup slot',
  requiresGMDecision:true,executionAllowed:false
 }));
 const known=rows.filter(r=>r.positionKnown).reduce((n,r)=>n+r.selectedCount,0);
 const missing=rows.filter(r=>!r.positionKnown).reduce((n,r)=>n+r.selectedCount,0);
 const evidenceGaps=[
  ...(missing?[{id:'unknown-positions',count:missing,explanation:'Position missing from selected staged players'}]:[]),
  ...(planning.missingOverallCount?[{id:'missing-overalls',count:planning.missingOverallCount,explanation:'Overall missing from selected staged players'}]:[]),
  {id:'unselected-roster',count:null,explanation:'Unselected roster members were not compared'},
  {id:'lineup-eligibility',count:null,explanation:'Eligibility, availability and slot constraints were not supplied'}
 ];
 return {kind:'experimental-gm-lineup-evidence-matrix',focus,selectedPlayerCount:planning.selectedPlayerCount,knownPositionPlayerCount:known,unknownPositionPlayerCount:missing,rows,evidenceGaps,planningQuestions:planning.steps,confidence:planning.confidence,evidenceScope:'selected staged controlled-team players only',limitations:['Counts are descriptive, not required position quotas','No inferred eligibility, lineup assignments, ranking, transactions or persistence'],productionActivationAllowed:false,persistencePerformed:false,automaticTransactionsAllowed:false,automaticRosterChangesAllowed:false,gmApprovalStillRequired:true,finalDecisionMaker:'human-gm'};
}
return {inspect};
});
