/* Mission 1238: evidence-bounded next-step GM planning, no decisions or persistence. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./hlm-phase11-gm-lineup-coverage'):null);if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMGMLineupPlanning=api;})(typeof globalThis!=='undefined'?globalThis:this,function(coverageModule){
'use strict';
function plan(queue,state,focus,ids,approved){
 if(approved!==true)throw Error('Explicit human GM approval required');
 const source=coverageModule||(typeof globalThis!=='undefined'&&globalThis.HLMGMLineupCoverage);
 if(!source||typeof source.summarize!=='function')throw Error('Lineup coverage source unavailable');
 const coverage=source.summarize(queue,state,focus,ids,true);
 const positions=coverage.coverage.filter(x=>x.position!=='unknown').map(x=>x.position).sort();
 const unknown=coverage.warnings.find(x=>x.code==='unknown-position');
 const missing=coverage.warnings.find(x=>x.code==='missing-rating');
 const steps=[];
 if(unknown)steps.push({id:'verify-positions',evidence:'selected staged players',count:unknown.count,question:'Can the GM verify unknown source positions before evaluating positional coverage?',requiresGMDecision:true,executionAllowed:false});
 if(missing)steps.push({id:'verify-ratings',evidence:'selected staged players',count:missing.count,question:'Can the GM obtain missing overall ratings before interpreting player comparisons?',requiresGMDecision:true,executionAllowed:false});
 steps.push({id:'inspect-roster',evidence:'selected staged players only',count:coverage.selectedPlayerCount,question:'Which unselected controlled-team players should the GM inspect before judging full-roster depth?',requiresGMDecision:true,executionAllowed:false});
 steps.push({id:'check-eligibility',evidence:'lineup eligibility and slot availability not supplied',count:null,question:'What lineup eligibility, slot and tactical requirements must the GM verify outside this preview?',requiresGMDecision:true,executionAllowed:false});
 return {kind:'experimental-gm-lineup-planning',focus,selectedPlayerCount:coverage.selectedPlayerCount,observedPositions:positions,unknownPositionCount:unknown?unknown.count:0,missingOverallCount:missing?missing.count:0,evidenceScope:'selected staged controlled-team players only',confidence:unknown||missing?'incomplete-source-evidence':'selected-player-evidence-only',coverage,steps,limitations:['Not a full roster analysis','No lineup assignments, ranking, eligibility inference, or tactical recommendation'],productionActivationAllowed:false,persistencePerformed:false,automaticTransactionsAllowed:false,automaticRosterChangesAllowed:false,gmApprovalStillRequired:true,finalDecisionMaker:'human-gm'};
}
return {plan};
});
