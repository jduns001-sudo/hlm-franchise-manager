/* Mission 1367: read-only GM injury readiness from the existing isolated GameState. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMGMInjuryReadiness=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function review(state,gameId){
 if(!state||!Array.isArray(state.universe?.players)||!Array.isArray(state.activity?.games))return 'Import an isolated franchise to review injury readiness.';
 const game=state.activity.games.find(g=>String(g.id)===String(gameId)&&g.status==='scheduled');
 if(!game)return 'Select a scheduled game to review injury readiness.';
 const gm=String(state.meta?.controlledTeamId);
 const participating=[game.homeTeamId,game.awayTeamId].some(id=>String(id)===gm);
 if(!participating)return 'Selected game does not involve your controlled team.';
 const players=state.universe.players.filter(p=>String(p.teamId)===gm);
 const injuries=Array.isArray(state.activity.injuries)?state.activity.injuries:[];
 const relevant=injuries.filter(i=>i&&players.some(p=>String(p.id)===String(i.playerId))&&i.status!=='resolved'&&i.status!=='recovered'&&i.active!==false);
 const lines=relevant.map(i=>{
  const p=players.find(p=>String(p.id)===String(i.playerId));
  const label=String(p?.name||p?.id||'Unknown');
  return label+' | '+String(i.status||'Status unknown')+' | '+String(i.type||i.injuryType||'Injury details unavailable');
 });
 return 'Your roster: '+players.length+' players | Reported unresolved injuries: '+relevant.length+'\n'+(lines.join('\n')||'No unresolved injury records for your roster.')+'\nInjury records are informational. Availability and lineup eligibility are not inferred. Review roster and confirm any lineup decisions as human GM.';
}
return {review};
});
