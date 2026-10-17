/* Mission 1234: descriptive, human-only player and position comparison. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./hlm-phase11-gm-grounded-decision-context'):null);if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMGMPlayerPositionComparison=api;})(typeof globalThis!=='undefined'?globalThis:this,function(grounded){
'use strict';
function compare(queue,state,focus,approved){
 if(approved!==true)throw Error('Explicit human GM approval required');
 if(focus!=='roster'&&focus!=='lineup')throw Error('Roster or lineup focus required');
 const api=grounded||(typeof globalThis!=='undefined'&&globalThis.HLMGMGroundedDecisionContext),base=api.summarize(queue,state,focus,true);
 const groups=new Map();for(const p of base.rosterContext.players){const key=p.position||'unknown';if(!groups.has(key))groups.set(key,[]);groups.get(key).push({id:p.id,name:p.name,position:p.position,overall:p.overall,missingFields:['name','position','overall'].filter(k=>p[k]===null),confidence:p.name!==null&&p.position!==null&&p.overall!==null?'source-fields-present':'incomplete-source-fields'});}
 const positions=Array.from(groups,([position,players])=>({position,count:players.length,players,completeRecords:players.filter(p=>p.missingFields.length===0).length,missingRecords:players.filter(p=>p.missingFields.length>0).length,reviewQuestion:'Does the GM want to inspect these '+players.length+' staged '+position+' records before considering '+focus+' changes?',actionType:'review-only',executionAllowed:false})).sort((a,b)=>a.position.localeCompare(b.position));
 const missingFields={name:0,position:0,overall:0};for(const group of positions)for(const p of group.players)for(const field of p.missingFields)missingFields[field]++;
 return {kind:'experimental-gm-player-position-comparison',focus,controlledTeamId:base.controlledTeamId,source:'isolated-front-office-staging',positions,playerCount:base.rosterContext.playerCount,missingFields,confidence:positions.length&&Object.values(missingFields).every(v=>v===0)?'source-fields-present-not-verified':'incomplete-source-fields',humanReviewQuestions:positions.map(p=>({position:p.position,question:p.reviewQuestion,requiresGMDecision:true,actionType:'review-only',executionAllowed:false})),limitations:[...base.limitations,'Source fields present is not an independent scouting or performance confidence assessment','No comparative ranking, lineup assignment or roster recommendation is inferred'],productionActivationAllowed:false,persistencePerformed:false,automaticTransactionsAllowed:false,automaticRosterChangesAllowed:false,gmApprovalStillRequired:true,finalDecisionMaker:'human-gm'};
}
return {compare};
});
