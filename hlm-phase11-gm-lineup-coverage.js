/* Mission 1237: source-only selected-player coverage, never a lineup assignment. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./hlm-phase11-gm-multi-player-position-review'):null);if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMGMLineupCoverage=api;})(typeof globalThis!=='undefined'?globalThis:this,function(multi){
'use strict';
function summarize(queue,state,focus,ids,approved){
 if(approved!==true)throw Error('Explicit human GM approval required');
 const source=multi||(typeof globalThis!=='undefined'&&globalThis.HLMGMMultiPlayerPositionReview);
 const report=source.review(queue,state,focus,ids,true);
 const counts=Object.create(null);
 for(const p of report.players){const pos=p.position||'unknown';counts[pos]=(counts[pos]||0)+1;}
 const coverage=Object.keys(counts).sort().map(position=>({position,selectedCount:counts[position],source:'selected staged controlled-team players',isLineupAssignment:false}));
 const warnings=[];
 if(report.missingFields.position)warnings.push({code:'unknown-position',count:report.missingFields.position,message:report.missingFields.position+' selected player(s) have unknown source positions; no position inferred'});
 if(report.missingFields.overall)warnings.push({code:'missing-rating',count:report.missingFields.overall,message:report.missingFields.overall+' selected player(s) have missing source overall ratings; no rating inferred'});
 const questions=[{id:'coverage',question:'Which positions should the GM inspect against the complete roster before planning a lineup?'},{id:'evidence',question:'Should the GM obtain missing position or rating data before comparing these players?'}].map(q=>({...q,requiresGMDecision:true,executionAllowed:false}));
 return {kind:'experimental-gm-lineup-coverage',focus,controlledTeamId:report.controlledTeamId,source:report.source,selectedPlayerCount:report.selectedPlayerCount,coverage,warnings,humanPlanningQuestions:questions,limitations:['Coverage describes only selected staged players; it does not establish lineup slots, eligibility or roster-wide depth','No lineup assignment, ranking, automatic decision, transaction or persistence'],productionActivationAllowed:false,persistencePerformed:false,automaticTransactionsAllowed:false,automaticRosterChangesAllowed:false,gmApprovalStillRequired:true,finalDecisionMaker:'human-gm'};
}
return {summarize};
});
