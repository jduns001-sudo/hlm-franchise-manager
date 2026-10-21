'use strict';
// Read-only GM upcoming matchup board. Never writes a save or makes a lineup decision.
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.HLMGMUpcomingReadinessBoard=api;})(typeof window!=='undefined'?window:null,function(){
 function build(state,limit=5){
  if(!state||!state.meta||!state.activity||!state.universe)throw Error('Load an isolated franchise to review upcoming games');
  const owner=String(state.meta.controlledTeamId??'');
  const names=new Map((state.universe.teams||[]).map(t=>[String(t.id),String(t.name||t.id)]));
  const games=(state.activity.games||[]).filter(g=>g.status==='scheduled'&&(String(g.homeTeamId)===owner||String(g.awayTeamId)===owner)).slice().sort((a,b)=>String(a.date||'').localeCompare(String(b.date||''))||String(a.id).localeCompare(String(b.id))).slice(0,Math.max(0,Math.min(10,Number(limit)||5)));
  return games.map(g=>({gameId:String(g.id),date:String(g.date||'Unscheduled'),home:names.get(String(g.homeTeamId))||String(g.homeTeamId),away:names.get(String(g.awayTeamId))||String(g.awayTeamId),homeGame:String(g.homeTeamId)===owner}));
 }
 function render(rows){if(!rows.length)return 'No upcoming controlled-team games. Review season progress or playoffs.';return rows.map((g,i)=>String(i+1)+'. '+g.date+' | '+g.home+' vs '+g.away+' | '+(g.homeGame?'HOME':'AWAY')+' | Game '+g.gameId+' | Select this game to review skaters, injuries and goalie before GM approval.').join('\n');}
 return Object.freeze({build,render});
});