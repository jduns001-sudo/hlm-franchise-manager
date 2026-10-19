/* Mission 1366: read-only, source-grounded isolated scheduled matchup review. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMGMMatchupReview=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function review(state,gameId){
 if(!state||!Array.isArray(state.activity?.games)||!Array.isArray(state.universe?.teams)||!Array.isArray(state.universe?.players))return 'Import an isolated franchise to review a matchup.';
 const games=state.activity.games.filter(g=>String(g.id)===String(gameId)&&g.status==='scheduled');
 if(games.length!==1)return 'Select an available scheduled game to review.';
 const g=games[0],gm=String(state.meta?.controlledTeamId);
 const teams=[g.homeTeamId,g.awayTeamId].map(id=>{
  const team=state.universe.teams.find(t=>String(t.id)===String(id));
  const players=state.universe.players.filter(p=>String(p.teamId)===String(id));
  const rated=players.map(p=>Number(p.overall??p.ovr)).filter(n=>Number.isFinite(n)&&n>=0&&n<=100);
  const avg=rated.length?(rated.reduce((a,b)=>a+b,0)/rated.length).toFixed(1):'unavailable';
  return {name:String(team?.name||id),count:players.length,rated:rated.length,avg,goalies:players.filter(p=>String(p.position||'').toUpperCase()==='G').length,gm:String(id)===gm};
 });
 return 'Scheduled: '+String(g.date||'Unknown date')+' | '+teams[0].name+' vs '+teams[1].name+'\n'+teams.map(t=>(t.gm?'Your team: ':'Opponent: ')+t.name+' | Players: '+t.count+' | Goalies: '+t.goalies+' | Available OVR: '+t.avg+' ('+t.rated+' rated)').join('\n')+'\nRead-only roster evidence, not a win prediction. Missing ratings excluded. Human GM approval is required to play.';
}
return {review};
});
