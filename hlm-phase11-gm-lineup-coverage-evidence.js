/* Mission 1237: descriptive selected-player lineup coverage, not a lineup generator. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./hlm-phase11-gm-multi-player-position-review'):null);if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMGMLineupCoverageEvidence=api;})(typeof globalThis!=='undefined'?globalThis:this,function(multi){
'use strict';
function summarize(queue,state,selectedIds,approved){
 if(approved!==true)throw Error('Explicit human GM approval required');
 const api=multi||(typeof globalThis!=='undefined'&&globalThis.HLMGMMultiPlayerPositionReview);
 const base=api.review(queue,state,'lineup',selectedIds,true);
 const positionCoverage=base.positionGroups.map(g=>({position:g.position,selectedCount:g.count,playerIds:[...g.playerIds],missingRecordCount:g.missingRecordCount,coverageScope:'selected-staged-players-only',notALineupAssignment:true}));
 const warnings=[];
 if(base.missingFields.position>0)warnings.push({code:'unknown-position',count:base.missingFields.position,message:base.missingFields.position+' selected player positions are unknown; no position coverage can be inferred for them'});
 if(base.missingFields.overall>0)warnings.push({code:'missing-overall',count:base.missingFields.overall,message:base.missingFields.overall+' selected player overall ratings are missing; do not infer ratings or rankings'});
 if(base.missingFields.name>0)warnings.push({code:'missing-name',count:base.missingFields.name,message:base.missingFields.name+' selected player names are missing from the staged source'});
 const humanReviewQuestions=positionCoverage.map(g=>({position:g.position,question:'Does the GM want to review '+g.selectedCount+' selected staged '+g.position+' records and source gaps before planning a lineup?',requiresGMDecision:true,actionType:'review-only',executionAllowed:false}));
 if(warnings.length)humanReviewQuestions.push({position:null,question:'Should the GM verify the missing source fields before considering any lineup changes?',requiresGMDecision:true,actionType:'review-only',executionAllowed:false});
 return {kind:'experimental-gm-lineup-coverage-evidence',controlledTeamId:base.controlledTeamId,source:base.source,selectedPlayerCount:base.selectedPlayerCount,positionCoverage,missingFields:{...base.missingFields},warnings,humanReviewQuestions,confidence:base.confidence,limitations:[...base.limitations,'Coverage is a count of selected staged players, not lineup slot sufficiency, eligibility, chemistry or role suitability','No missing ratings, positions, lineup requirements or depth are inferred'],productionActivationAllowed:false,persistencePerformed:false,automaticTransactionsAllowed:false,automaticRosterChangesAllowed:false,automaticLineupAssignmentsAllowed:false,gmApprovalStillRequired:true,finalDecisionMaker:'human-gm'};
}
return {summarize};
});
