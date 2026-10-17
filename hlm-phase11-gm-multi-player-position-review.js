/* Mission 1236: source-only multi-player position review, no lineup assignments. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./hlm-phase11-gm-player-position-comparison'):null);if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMGMMultiPlayerPositionReview=api;})(typeof globalThis!=='undefined'?globalThis:this,function(comparison){
'use strict';
function review(queue,state,focus,selectedIds,approved){
 if(approved!==true)throw Error('Explicit human GM approval required');
 const api=comparison||(typeof globalThis!=='undefined'&&globalThis.HLMGMPlayerPositionComparison);
 const base=api.compare(queue,state,focus,true);
 if(!Array.isArray(selectedIds)||selectedIds.length<2||selectedIds.length>12)throw Error('Select 2 to 12 distinct staged players');
 const ids=selectedIds.map(id=>{if(id===null||id===undefined||String(id).trim()==='')throw Error('Missing player ID');return String(id)});
 if(new Set(ids).size!==ids.length)throw Error('Duplicate player selection');
 const available=base.positions.flatMap(g=>g.players);
 const selected=ids.map(id=>{const matches=available.filter(p=>String(p.id)===id);if(matches.length!==1)throw Error('Selected player not in controlled-team staged roster');const p=matches[0];return {id:p.id,name:p.name,position:p.position,overall:p.overall,missingFields:[...p.missingFields],confidence:p.confidence};});
 const groups=new Map();for(const p of selected){const position=p.position||'unknown';if(!groups.has(position))groups.set(position,[]);groups.get(position).push(p);}
 const positionGroups=Array.from(groups,([position,players])=>({position,count:players.length,playerIds:players.map(p=>p.id),missingRecordCount:players.filter(p=>p.missingFields.length>0).length,reviewQuestion:'Does the GM want to inspect '+players.length+' staged '+position+' player records before any lineup or roster decision?',requiresGMDecision:true,actionType:'review-only',executionAllowed:false})).sort((a,b)=>a.position.localeCompare(b.position));
 const missingFields={name:0,position:0,overall:0};for(const p of selected)for(const field of p.missingFields)missingFields[field]++;
 return {kind:'experimental-gm-multi-player-position-review',focus,controlledTeamId:base.controlledTeamId,source:base.source,players:selected,positionGroups,selectedPlayerCount:selected.length,missingFields,confidence:Object.values(missingFields).every(v=>v===0)?'source-fields-present-not-verified':'incomplete-source-fields',humanReviewQuestions:positionGroups.map(g=>({position:g.position,question:g.reviewQuestion,requiresGMDecision:true,actionType:'review-only',executionAllowed:false})),limitations:[...base.limitations,'Position groups describe only the selected staged players, not a recommended lineup','Missing positions and ratings remain unknown; no inferred role, ranking or assignment','No production save, isolated save or lineup mutation occurs'],productionActivationAllowed:false,persistencePerformed:false,automaticTransactionsAllowed:false,automaticRosterChangesAllowed:false,gmApprovalStillRequired:true,finalDecisionMaker:'human-gm'};
}
return {review};
});
