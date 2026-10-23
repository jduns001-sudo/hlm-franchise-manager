/* Mission 1507C: read-only next GM action derived from the existing Office projection. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMPhase11GmDecisionCenter=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const DESTINATION='./hlm-phase11-isolated-single-game.html#gm-game-day-workspace-heading';
function project(summary){
 if(!summary||typeof summary!=='object')throw Error('Authoritative Office projection required');
 if(summary.status==='no-franchise')return Object.freeze({status:'no-franchise',message:'No isolated franchise loaded. Resume franchise to begin.',action:null});
 if(summary.status!=='ready'||summary.source!=='isolated-franchise-state'||summary.readOnly!==true)throw Error('Unverified Office projection');
 if(!summary.nextGame)return Object.freeze({status:'no-upcoming-game',message:'No upcoming controlled-team game requires review.',action:null});
 const game=summary.nextGame,readiness=summary.readiness;
 if(!game.gameId||!game.date||!readiness)throw Error('Incomplete source-backed game readiness');
 const missing=[];
 if(!readiness.goalieApproved)missing.push('goalie plan');
 if(!readiness.gameDaySkatersApproved)missing.push('skater review');
 const message=missing.length?'GM review needed: '+missing.join(' and ')+'.':'Recorded plans exist. Human GM must still approve simulation.';
 return Object.freeze({status:'review-required',gameId:game.gameId,message,action:Object.freeze({label:'Open guarded game-day review',href:DESTINATION}),readOnly:true,requiresHumanApproval:true});
}
return {project};
});
