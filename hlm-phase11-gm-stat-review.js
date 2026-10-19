/* Read-only experimental GM statistical history from the isolated save only. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMGMStatReview=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function review(state,{teamId=null,season=null,kind=null}={}){
 const reports=state?.extensions?.phase11ExperimentalBoxScores;
 if(!Array.isArray(reports)||!reports.length)return {available:false,reason:'No experimental box scores in this isolated save.',seasons:[],players:[],goalies:[],games:0,official:false};
 const team=String(teamId??state?.meta?.controlledTeamId??'');
 const seen=new Set(),seasons=new Set(),players=new Map(),goalies=new Map();let games=0;
 for(const box of reports){
  if(!box||box.experimental!==true||box.official!==false)throw Error('Nonexperimental statistics cannot be displayed as experimental');
  const year=String(box.season??'unspecified'),type=box.playoff?'playoffs':'regular',key=year+':'+String(box.gameId);
  if(seen.has(key))throw Error('Duplicate game box score');seen.add(key);
  seasons.add(year);
  if(season!=null&&String(season)!==year||kind!=null&&kind!==type)continue;
  const sides=['home','away'].map(side=>box[side]).filter(row=>row&&String(row.teamId)===team);
  for(const row of sides){
   games++;
   if(row.players.reduce((n,p)=>n+p.goals,0)!==row.goals||row.players.reduce((n,p)=>n+p.shots,0)!==row.shots)throw Error('Inconsistent team totals');
   for(const p of row.players){
    if(p.points!==p.goals+p.assists||p.shots<p.goals)throw Error('Inconsistent player totals');
    const id=String(p.playerId),r=players.get(id)||{playerId:id,games:0,goals:0,assists:0,shots:0,points:0};
    r.games++;for(const metric of ['goals','assists','shots','points'])r[metric]+=p[metric];players.set(id,r);
   }
   const g=row.goalie;
   if(g.saves+g.goalsAgainst!==g.shotsAgainst)throw Error('Inconsistent goalie totals');
   const id=String(g.playerId),r=goalies.get(id)||{playerId:id,games:0,saves:0,shotsAgainst:0,goalsAgainst:0};
   r.games++;for(const metric of ['saves','shotsAgainst','goalsAgainst'])r[metric]+=g[metric];goalies.set(id,r);
  }
 }
 return {available:true,teamId:team,seasons:[...seasons].sort(),games,
  players:[...players.values()].sort((a,b)=>b.points-a.points||a.playerId.localeCompare(b.playerId)),
  goalies:[...goalies.values()].map(g=>({...g,savePercentage:g.shotsAgainst?g.saves/g.shotsAgainst:null})).sort((a,b)=>a.playerId.localeCompare(b.playerId)),
  experimental:true,official:false,attribution:'Synthetic shots and assists, not official play-by-play'};
}
function format(report){
 if(!report.available)return report.reason;
 const lines=['EXPERIMENTAL GM STAT REVIEW | NOT OFFICIAL','Synthetic shots and assists; no production save changes.','Controlled team: '+report.teamId+' | Games: '+report.games,'Players (GP G A PTS SOG):'];
 for(const p of report.players)lines.push(p.playerId+'  '+[p.games,p.goals,p.assists,p.points,p.shots].join('  '));
 lines.push('Goalies (GP SV SA GA SV%):');
 for(const g of report.goalies)lines.push(g.playerId+'  '+[g.games,g.saves,g.shotsAgainst,g.goalsAgainst,g.savePercentage==null?'N/A':g.savePercentage.toFixed(3)].join('  '));
 if(!report.players.length&&!report.goalies.length)lines.push('No matching team statistics.');
 return lines.join('\n');
}
return {review,format};
});
