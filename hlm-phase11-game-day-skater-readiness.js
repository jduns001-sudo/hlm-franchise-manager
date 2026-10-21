/* Mission 1400: read-only game-day validation of human GM approved skater plans. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMGameDaySkaterReadiness=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function review(state,gameId){
 if(!state?.meta||!Array.isArray(state.universe?.players)||!Array.isArray(state.activity?.games))throw Error('Valid isolated franchise required');
 const games=state.activity.games.filter(g=>String(g.id)===String(gameId));
 if(games.length!==1||games[0].status!=='scheduled')throw Error('Choose one scheduled game');
 const game=games[0],teamId=state.meta.controlledTeamId;
 if(String(game.homeTeamId)!==String(teamId)&&String(game.awayTeamId)!==String(teamId))return Object.freeze({status:'other-team-game',ready:false,players:[],issues:['Controlled team not playing']});
 const plan=state.extensions?.phase11GmApprovedSkaters;
 if(!plan||String(plan.teamId)!==String(teamId)||!Array.isArray(plan.playerIds))return Object.freeze({status:'no-approved-plan',ready:false,players:[],issues:['GM skater plan not approved']});
 const ids=plan.playerIds.map(String),issues=[],players=[];
 if(ids.length<3||new Set(ids).size!==ids.length)issues.push('At least three distinct GM-approved skaters required');
 for(const id of ids){
  const matches=state.universe.players.filter(p=>String(p.id)===id&&String(p.teamId)===String(teamId));
  if(matches.length!==1){issues.push('Approved skater '+id+' missing or no longer owned');continue}
  const p=matches[0];players.push({id:p.id,name:String(p.name||p.id),position:String(p.position||'')});
  if(!['C','LW','RW','D','F'].includes(String(p.position||'').toUpperCase()))issues.push('Approved player '+id+' is not a skater');
  const rating=p.overall??p.ovr;if(!Number.isSafeInteger(rating)||rating<1||rating>99)issues.push('Approved skater '+id+' lacks valid rating');
  if((state.activity.injuries||[]).some(i=>String(i.playerId)===id&&i.active!==false&&i.status!=='resolved'&&i.status!=='recovered'))issues.push('Approved skater '+id+' has unresolved injury');
  const signing=(state.activity.transactions||[]).some(t=>t?.type==='drafted-prospect-signing'&&String(t.playerId)===id&&String(t.teamId)===String(teamId));
  if(signing&&!(state.assets?.contracts||[]).some(c=>String(c.playerId)===id&&String(c.teamId)===String(teamId)&&c.status==='active'))issues.push('Signed prospect '+id+' lacks active controlled-team contract');
 }
 return Object.freeze({status:issues.length?'needs-gm-review':'ready',ready:issues.length===0,teamId,gameId:game.id,players:Object.freeze(players),issues:Object.freeze(issues)});
}
return {review};
});
