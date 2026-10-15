'use strict';
const {auditGameplayReadiness}=require('./hlm-phase10-gameplay-readiness');
/**
 * Read-only integration gate for imported multiteam season simulation.
 * This does not activate, migrate or write any production franchise save.
 */
function auditIntegratedSeason(state){
 const baseline=auditGameplayReadiness(state);
 const issues=[...baseline.issues];
 if(!baseline.snapshot)return Object.freeze({ready:false,issues,snapshot:null});
 const teams=state.universe.teams,players=state.universe.players,games=state.activity.games;
 const teamIds=new Set(),playerIds=new Set(),gameIds=new Set();
 for(const team of teams){
  const id=team&&team.id;
  if(id==null||!String(id).trim()||teamIds.has(String(id)))issues.push({code:'INVALID_OR_DUPLICATE_TEAM_ID',id:id??null});
  else teamIds.add(String(id));
 }
 for(const player of players){
  const id=player&&player.id;
  if(id==null||!String(id).trim()||playerIds.has(String(id)))issues.push({code:'INVALID_OR_DUPLICATE_PLAYER_ID',id:id??null});
  else playerIds.add(String(id));
  if(player&&player.teamId!=null&&!teamIds.has(String(player.teamId))&&!teams.some(t=>t&&String(t.id)===String(player.teamId)))issues.push({code:'PLAYER_TEAM_NOT_FOUND',id:id??null});
 }
 let scheduled=0,completed=0;
 for(const game of games){
  if(!game||game.id==null||!String(game.id).trim()||gameIds.has(String(game.id)))issues.push({code:'INVALID_OR_DUPLICATE_GAME_ID',id:game&&game.id??null});
  else gameIds.add(String(game.id));
  if(game&&(!teamIds.has(String(game.homeTeamId))||!teamIds.has(String(game.awayTeamId))||String(game.homeTeamId)===String(game.awayTeamId)))issues.push({code:'INVALID_GAME_TEAMS',id:game.id??null});
  if(game&&game.status==='scheduled')scheduled++;
  if(game&&['completed','final'].includes(game.status))completed++;
 }
 const snapshots=state.finances&&state.finances.teamSnapshots;
 const financeCoverage=snapshots&&typeof snapshots==='object'&&!Array.isArray(snapshots)
  ?teams.filter(t=>Object.prototype.hasOwnProperty.call(snapshots,String(t.id))).length:0;
 const snapshot={...baseline.snapshot,completedGames:completed,financeSnapshotTeams:financeCoverage,financeSnapshotMissing:teams.length-financeCoverage};
 return Object.freeze({ready:issues.length===0,issues,snapshot});
}
module.exports={auditIntegratedSeason};
