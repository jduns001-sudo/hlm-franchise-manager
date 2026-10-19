/* Read-only isolated franchise season overview, derived from saved GameState. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMIsolatedSeasonDashboard=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function overview(state,engine,limit=8){
 if(!state)return null;
 if(!Number.isSafeInteger(limit)||limit<1||limit>50)throw Error('Invalid preview limit');
 const games=state.activity?.games||[];
 const completed=games.filter(g=>g.status==='final').sort((a,b)=>String(b.date).localeCompare(String(a.date))||String(a.id).localeCompare(String(b.id)));
 const upcoming=games.filter(g=>g.status==='scheduled').sort((a,b)=>String(a.date).localeCompare(String(b.date))||String(a.id).localeCompare(String(b.id)));
 const standings=engine.calculateStandings(state.universe.teams,games);
 return {date:state.meta.currentDate,completedCount:completed.length,scheduledCount:upcoming.length,latestResults:completed.slice(0,limit).map(g=>({id:g.id,date:g.date,homeTeamId:g.homeTeamId,awayTeamId:g.awayTeamId,homeGoals:g.homeGoals,awayGoals:g.awayGoals,experimentalRosterAware:g.experimentalRosterAware===true,official:g.official===false?false:undefined})),upcoming:upcoming.slice(0,limit).map(g=>({id:g.id,date:g.date,homeTeamId:g.homeTeamId,awayTeamId:g.awayTeamId})),standings};
}
return {overview};
});
