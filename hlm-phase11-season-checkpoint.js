/* Mission 1312: deterministic, read-only season checkpoint for isolated playable sessions. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMSeasonCheckpoint=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function checkpoint(bridge){
 if(!bridge||typeof bridge.load!=='function'||typeof bridge.playableFranchiseSnapshot!=='function')throw Error('Isolated bridge required');
 const state=bridge.load();if(!state)throw Error('No isolated franchise loaded');
 const snapshot=bridge.playableFranchiseSnapshot(),teams=state.universe&&state.universe.teams,games=state.activity&&state.activity.games;
 if(!Array.isArray(teams)||!Array.isArray(games))throw Error('Invalid isolated season');
 const ids=new Set(teams.map(t=>String(t.id))),seen=new Set(),finals=[],pending=[];
 for(const game of games){
  if(!game||game.id==null||seen.has(String(game.id)))throw Error('Missing or duplicate game ID');
  seen.add(String(game.id));
  if(!ids.has(String(game.homeTeamId))||!ids.has(String(game.awayTeamId))||String(game.homeTeamId)===String(game.awayTeamId))throw Error('Invalid scheduled matchup');
  if(typeof game.date!=='string'||!/^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.test(game.date)||Number.isNaN(Date.parse(game.date+'T00:00:00Z')))throw Error('Invalid game date');
  if(game.status==='final'){
   if(!Number.isSafeInteger(game.homeGoals)||game.homeGoals<0||!Number.isSafeInteger(game.awayGoals)||game.awayGoals<0)throw Error('Invalid final score');
   finals.push(game);
  }else if(game.status==='scheduled')pending.push(game);else throw Error('Unsupported game status');
 }
 const controlled=String(state.meta.controlledTeamId),owned=games.filter(g=>String(g.homeTeamId)===controlled||String(g.awayTeamId)===controlled);
 const complete=owned.filter(g=>g.status==='final');
 const wins=complete.filter(g=>(String(g.homeTeamId)===controlled?g.homeGoals>g.awayGoals:g.awayGoals>g.homeGoals)).length;
 const ties=complete.filter(g=>g.homeGoals===g.awayGoals).length;
 const goalsFor=complete.reduce((n,g)=>n+(String(g.homeTeamId)===controlled?g.homeGoals:g.awayGoals),0);
 const goalsAgainst=complete.reduce((n,g)=>n+(String(g.homeTeamId)===controlled?g.awayGoals:g.homeGoals),0);
 const next=pending.filter(g=>String(g.homeTeamId)===controlled||String(g.awayTeamId)===controlled).sort((a,b)=>a.date.localeCompare(b.date)||String(a.id).localeCompare(String(b.id)))[0];
 const output={kind:'isolated-season-checkpoint',team:snapshot.team,asOfDate:snapshot.asOfDate,leagueGamesCompleted:finals.length,leagueGamesRemaining:pending.length,controlledGamesCompleted:complete.length,controlledGamesRemaining:owned.length-complete.length,record:Object.freeze({wins,losses:complete.length-wins-ties,ties}),goalsFor,goalsAgainst,goalDifferential:goalsFor-goalsAgainst,nextGame:next?Object.freeze({date:next.date,venue:String(next.homeTeamId)===controlled?'home':'away'}):null,seasonComplete:pending.length===0,rosterVerification:'pending',playerStatistics:'unavailable-from-score-only',independentVerification:'pending',persistencePerformed:false,productionActivationAllowed:false,automaticTransactionsAllowed:false,finalDecisionMaker:'human-gm'};
 return Object.freeze(output);
}
return Object.freeze({checkpoint});
});
