/* Mission 1244: compare two unresolved source gates without making eligibility judgments. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./hlm-phase11-gm-lineup-gate-review-brief'):null);if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMGMLineupGateEvidenceComparison=api;})(typeof globalThis!=='undefined'?globalThis:this,function(briefModule){
'use strict';
function compare(queue,state,focus,ids,leftId,rightId,approved){
 if(approved!==true)throw Error('Explicit human GM approval required');
 if(typeof leftId!=='string'||typeof rightId!=='string'||!leftId||!rightId||leftId===rightId)throw Error('Select two distinct evidence gates');
 const source=briefModule||(typeof globalThis!=='undefined'&&globalThis.HLMGMLineupGateReviewBrief);
 if(!source||typeof source.prepare!=='function')throw Error('GM lineup gate review source unavailable');
 const brief=source.prepare(queue,state,focus,ids,true);
 const left=brief.items.find(x=>x.gateId===leftId),right=brief.items.find(x=>x.gateId===rightId);
 if(!left||!right)throw Error('Selected evidence gate not present in staged source');
 const project=g=>({gateId:g.gateId,source:g.source,evidenceState:g.evidenceState,
  affectedSelectedPlayers:g.affectedSelectedPlayers,verificationQuestion:g.question,
  reviewStatus:'unresolved',humanVerificationRequired:true,executionAllowed:false});
 return {kind:'experimental-gm-lineup-gate-evidence-comparison',focus,
  selectedPlayerCount:brief.selectedPlayerCount,left:project(left),right:project(right),
  evidenceStatesMatch:left.evidenceState===right.evidenceState,
  affectedCountComparison:left.affectedSelectedPlayers===null||right.affectedSelectedPlayers===null?'not-comparable':'selected-source-counts-only',
  interpretation:'Gate evidence states are not lineup eligibility, player rankings or proof of resolution',
  lineupEligibility:'unknown',lineupAvailability:'unknown',evidenceReadiness:'not-established',
  productionActivationAllowed:false,persistencePerformed:false,automaticTransactionsAllowed:false,
  automaticRosterChangesAllowed:false,gmApprovalStillRequired:true,finalDecisionMaker:'human-gm'};
}
return {compare};
});
