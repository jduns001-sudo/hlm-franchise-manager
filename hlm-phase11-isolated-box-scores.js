/* Mission 1360: synthetic attribution for already-finalized authoritative isolated games. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMIsolatedBoxScores=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function append(before,after,build,seed=1){
 if(typeof build!=='function')throw Error('Existing unified box-score builder required');
 const finals=state=>{
  const regular=(state.activity?.games||[]).filter(g=>g.status==='final');
  const rounds=state.extensions?.phase10Playoffs?.rounds||[];
  const playoffs=rounds.flatMap(round=>round.flatMap(series=>series.games||[])).filter(g=>g.status==='final').map(g=>({...g,id:g.gameId,playoff:true}));
  return [...regular,...playoffs];
 };
 const identity=g=>String(g.playoff?'playoffs':'regular')+':'+String(g.id);
 const previous=new Set(finals(before).map(identity));
 const additions=finals(after).filter(g=>!previous.has(identity(g)));
 if(!additions.length)return after;
 const ext=after.extensions||{};
 const existing=ext.phase11ExperimentalBoxScores||[];
 if(!Array.isArray(existing))throw Error('Invalid existing experimental box scores');
 const seen=new Set(existing.map(b=>String(b.season??'unspecified')+':'+String(b.gameId)));
 const pending=additions;
 const eligible=pending.filter(g=>[g.homeTeamId,g.awayTeamId].every(id=>{
  const roster=after.universe.players.filter(p=>String(p.teamId)===String(id));
  return roster.some(p=>['C','LW','RW','D'].includes(p.position))&&roster.some(p=>p.position==='G');
 }));
 if(!eligible.length)return after; // Existing roster-free saves remain compatible.
 const date=String(before.meta?.currentDate||'');
 const match=/^(\d{4})-(\d{2})-\d{2}$/.exec(date);
 const year=match?Number(match[1]):null;
 const start=match?(Number(match[2])>=7?year:year-1):null;
 const inferred=start==null?null:String(start)+'-'+String((start+1)%100).padStart(2,'0');
 const season=before.extensions?.phase10CurrentSeasonId||inferred||'Imported';
 const games=eligible.map(g=>({...g,season:g.season??g.seasonId??season})).filter(g=>!seen.has(String(g.season)+':'+String(g.id)));
 const unique=new Set();
 for(const g of games){const key=String(g.season)+':'+String(g.id);if(unique.has(key))throw Error('Duplicate authoritative season game ID');unique.add(key)}
 if(!games.length)return after;
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
