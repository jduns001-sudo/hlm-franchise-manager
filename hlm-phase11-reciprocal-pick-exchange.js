'use strict';
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./hlm-game-state'):root.HLMPhase10);if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMReciprocalPickExchange=api;})(typeof globalThis!=='undefined'?globalThis:this,function(engine){
function reviewReciprocalPickExchange(state,{controlledTeamId,otherTeamId,controlledPickId,otherPickId}={}){
 if(!engine.validateGameStateEnvelope(state).valid)throw Error('Invalid franchise game state');
 if([controlledTeamId,otherTeamId,controlledPickId,otherPickId].some(v=>v==null))throw Error('Two teams and two picks required');
 if(String(controlledTeamId)===String(otherTeamId)||String(controlledPickId)===String(otherPickId))throw Error('Distinct teams and picks required');
 if(String(state.meta?.controlledTeamId)!==String(controlledTeamId))throw Error('Human GM must control the proposing team');
 const teams=state.universe.teams;
 if(!teams.some(t=>String(t.id)===String(controlledTeamId))||!teams.some(t=>String(t.id)===String(otherTeamId)))throw Error('Unknown team');
 const picks=state.assets.draftPicks;
 function pick(id,owner){
  const matches=picks.filter(p=>p&&String(p.pickId)===String(id));
  if(matches.length!==1)throw Error('Missing or duplicate source pick');
  const p=matches[0];
  if(p.source!=='hlm-universe.json'||p.status!=='AVAILABLE'||p.selectedProspectId!=null||String(p.currentOwnerId)!==String(owner))throw Error('Pick unavailable or ownership unverified');
  return p;
 }
 const first=pick(controlledPickId,controlledTeamId),second=pick(otherPickId,otherTeamId);
 const nextState=JSON.parse(JSON.stringify(state));
 nextState.assets.draftPicks.find(p=>String(p.pickId)===String(first.pickId)).currentOwnerId=otherTeamId;
 nextState.assets.draftPicks.find(p=>String(p.pickId)===String(second.pickId)).currentOwnerId=controlledTeamId;
 return {nextState,review:{controlledTeamId,otherTeamId,controlledPickId,otherPickId,source:'hlm-universe.json',requiresGmApproval:true,officialTrade:false}};
}
return {reviewReciprocalPickExchange};
});