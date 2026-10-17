/* Mission 1210: deterministic, read-only gameplay readiness diagnostics. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMGameplayReadiness=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function evaluate(state){
 const issues=[],add=(code,severity,detail)=>issues.push({code,severity,detail});
 if(!state||!state.meta||!state.universe||!state.assets||!state.activity)throw Error('Canonical GameState required');
 const teams=state.universe.teams,players=state.universe.players,contracts=state.assets.contracts,games=state.activity.games;
 if(![teams,players,contracts,games].every(Array.isArray))throw Error('Canonical roster, contracts and schedule arrays required');
 const ids=(items,kind)=>{const seen=new Set();for(const item of items){if(!item||item.id==null||String(item.id).trim()===''||seen.has(String(item.id)))add('INVALID_'+kind+'_IDENTITY','blocker',String(item&&item.id));else seen.add(String(item.id));}return seen;};
 const teamIds=ids(teams,'TEAM'),playerIds=ids(players,'PLAYER');ids(contracts,'CONTRACT');ids(games,'GAME');
 const controlled=teams.find(t=>t&&String(t.id)===String(state.meta.controlledTeamId));
 if(!controlled)add('CONTROLLED_TEAM_MISSING','blocker','No matching controlled team');
 if(!state.meta.saveId||typeof state.meta.currentDate!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(state.meta.currentDate))add('FRANCHISE_METADATA_MISSING','blocker','Save ID or current date missing');
 if(teams.length<2)add('INSUFFICIENT_TEAMS','blocker','At least two teams needed');
 if(!players.length)add('EMPTY_UNIVERSE_ROSTER','blocker','No players available');
 const teamCounts=new Map(teams.map(t=>[String(t.id),0]));
 for(const p of players){
  if(p.teamId==null){add('UNASSIGNED_PLAYER','warning',String(p.id));continue;}
  if(!teamIds.has(String(p.teamId)))add('UNKNOWN_PLAYER_TEAM','blocker',String(p.id));
  else teamCounts.set(String(p.teamId),(teamCounts.get(String(p.teamId))||0)+1);
 }
 for(const t of teams)if(t&&teamCounts.get(String(t.id))===0)add('EMPTY_TEAM_ROSTER','warning',String(t.id));
 const contractPlayers=new Set();
 for(const c of contracts){
  if(c.playerId==null||!playerIds.has(String(c.playerId)))add('ORPHAN_CONTRACT','blocker',String(c.id));
  else if(contractPlayers.has(String(c.playerId)))add('MULTIPLE_CONTRACTS','warning',String(c.playerId));
  else contractPlayers.add(String(c.playerId));
 }
 for(const p of players)if(p.teamId!=null&&teamIds.has(String(p.teamId))&&!contractPlayers.has(String(p.id)))add('ROSTER_PLAYER_NO_CONTRACT','warning',String(p.id));
 if(!games.length)add('SCHEDULE_MISSING','blocker','No games available; schedule generation not automatic');
 let upcoming=0;
 for(const g of games){
  if(!teamIds.has(String(g.homeTeamId))||!teamIds.has(String(g.awayTeamId))||String(g.homeTeamId)===String(g.awayTeamId))add('INVALID_GAME_TEAMS','blocker',String(g.id));
  if(!/^\d{4}-\d{2}-\d{2}$/.test(String(g.date)))add('INVALID_GAME_DATE','blocker',String(g.id));
  if(g.status==='scheduled'){
   upcoming++;
   if(g.date<=state.meta.currentDate)add('SCHEDULED_GAME_NOT_FUTURE','warning',String(g.id));
  }
 }
 if(!upcoming)add('NO_UPCOMING_GAMES','blocker','No scheduled games to simulate');
 const blockers=issues.filter(i=>i.severity==='blocker').length;
 return {kind:'experimental-gameplay-readiness',ready:blockers===0,blockerCount:blockers,warningCount:issues.length-blockers,controlledTeamId:state.meta.controlledTeamId,teamCount:teams.length,playerCount:players.length,contractCount:contracts.length,scheduledGameCount:upcoming,issues,productionActivationAllowed:false,persistencePerformed:false,gmApprovalStillRequired:true};
}
return {evaluate};
});
