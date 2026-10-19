/* Mission 1360: synthetic attribution for already-finalized authoritative isolated games. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMIsolatedBoxScores=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function append(before,after,build,seed=1){
 if(typeof build!=='function')throw Error('Existing unified box-score builder required');
 const previous=new Set((before.activity?.games||[]).filter(g=>g.status==='final').map(g=>String(g.id)));
 const additions=(after.activity?.games||[]).filter(g=>g.status==='final'&&!previous.has(String(g.id)));
 if(!additions.length)return after;
 const ext=after.extensions||{};
 const existing=ext.phase11ExperimentalBoxScores||[];
 if(!Array.isArray(existing))throw Error('Invalid existing experimental box scores');
 const seen=new Set(existing.map(b=>String(b.gameId)));
 const pending=additions.filter(g=>!seen.has(String(g.id)));
 const eligible=pending.filter(g=>[g.homeTeamId,g.awayTeamId].every(id=>{
  const roster=after.universe.players.filter(p=>String(p.teamId)===String(id));
  return roster.some(p=>['C','LW','RW','D'].includes(p.position))&&roster.some(p=>p.position==='G');
 }));
 if(!eligible.length)return after; // Existing roster-free saves remain compatible.
 const season=before.extensions?.phase10CurrentSeasonId||'Imported';
 const games=eligible.map(g=>({...g,season:g.season??g.seasonId??season}));
 const events=[];
 for(const g of games)for(const [teamId,count] of [[g.homeTeamId,g.homeGoals],[g.awayTeamId,g.awayGoals]]){
  if(!Number.isSafeInteger(count)||count<0)throw Error('Invalid authoritative game goals');
  const skaters=after.universe.players.filter(p=>String(p.teamId)===String(teamId)&&['C','LW','RW','D'].includes(p.position)).sort((a,b)=>String(a.id).localeCompare(String(b.id)));
  for(let i=0;i<count;i++)events.push({gameId:g.id,teamId,playerId:skaters[(seed+i)%skaters.length].id,sequence:i+1});
 }
 const next=build(after,games,events,seed);
 return {...after,extensions:{...ext,phase11ExperimentalBoxScores:[...existing,...next]}};
}
return {append};
});
