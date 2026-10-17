/* Mission 1235: two explicitly selected staged players, descriptive comparison only. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./hlm-phase11-gm-player-position-comparison'):null);if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMGMSideBySidePlayerReview=api;})(typeof globalThis!=='undefined'?globalThis:this,function(comparison){
'use strict';
function review(queue,state,focus,leftId,rightId,approved){
 if(approved!==true)throw Error('Explicit human GM approval required');
 const api=comparison||(typeof globalThis!=='undefined'&&globalThis.HLMGMPlayerPositionComparison);
 const base=api.compare(queue,state,focus,true);
 const players=base.positions.flatMap(group=>group.players);
 const matches=id=>players.filter(p=>String(p.id)===String(id));
 if(leftId===null||leftId===undefined||rightId===null||rightId===undefined||String(leftId)===String(rightId))throw Error('Select two distinct staged player IDs');
 const left=matches(leftId),right=matches(rightId);
 if(left.length!==1||right.length!==1)throw Error('Both players must belong to the staged controlled-team roster');
 const pair=[left[0],right[0]].map(p=>({id:p.id,name:p.name,position:p.position,overall:p.overall,missingFields:[...p.missingFields],confidence:p.confidence}));
 const commonPosition=pair[0].position!==null&&pair[0].position===pair[1].position;
 const overallDifference=pair.every(p=>p.overall!==null)?pair[0].overall-pair[1].overall:null;
 return {kind:'experimental-gm-side-by-side-player-review',focus,controlledTeamId:base.controlledTeamId,source:base.source,players:pair,sharedPosition:commonPosition?pair[0].position:null,overallDifferenceFromStagedFields:overallDifference,missingFields:{left:[...pair[0].missingFields],right:[...pair[1].missingFields]},confidence:pair.every(p=>p.missingFields.length===0)?'source-fields-present-not-verified':'incomplete-source-fields',humanReviewQuestion:'Should the GM inspect the two staged player records and missing fields before considering any '+focus+' decision?',requiresGMDecision:true,actionType:'review-only',executionAllowed:false,limitations:[...base.limitations,'Overall difference is a source-field arithmetic comparison, not a recommendation or verified talent ranking','Different or unknown positions must not be treated as equivalent lineup roles','No lineup, trade, scouting or roster action is prepared or executed'],productionActivationAllowed:false,persistencePerformed:false,automaticTransactionsAllowed:false,automaticRosterChangesAllowed:false,gmApprovalStillRequired:true,finalDecisionMaker:'human-gm'};
}
return {review};
});
