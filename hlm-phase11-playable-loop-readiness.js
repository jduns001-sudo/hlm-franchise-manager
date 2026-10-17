'use strict';
const {auditIntegratedSeason}=require('./hlm-phase11-integrated-season-readiness');
/**
 * Read-only end-to-end acceptance preflight. It never advances a day, commits a
 * save, enables experimental modules or makes decisions for the human GM.
 */
function auditPlayableLoop(state){
 const base=auditIntegratedSeason(state);
 const issues=[...base.issues];
 if(!base.snapshot)return Object.freeze({ready:false,issues,snapshot:null});
 const meta=state.meta||{};
 const teams=state.universe.teams;
 const games=state.activity.games;
 const owner=meta.controlledTeamId;
 if(owner==null||!teams.some(t=>String(t.id)===String(owner)))
  issues.push({code:'CONTROLLED_TEAM_NOT_FOUND'});
 const date=meta.currentDate;
 if(typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date)||Number.isNaN(Date.parse(date+'T00:00:00Z'))||new Date(date+'T00:00:00Z').toISOString().slice(0,10)!==date)
  issues.push({code:'INVALID_CURRENT_DATE'});
 if(!games.length)issues.push({code:'NO_SEASON_SCHEDULE'});
 if(!games.some(g=>g&&String(g.homeTeamId)===String(owner)||g&&String(g.awayTeamId)===String(owner)))
  issues.push({code:'CONTROLLED_TEAM_NO_GAMES'});
 const byTeam=new Map(teams.map(t=>[String(t.id),0]));
 for(const g of games)if(g&&g.homeTeamId!=null&&g.awayTeamId!=null){
  if(byTeam.has(String(g.homeTeamId)))byTeam.set(String(g.homeTeamId),byTeam.get(String(g.homeTeamId))+1);
  if(byTeam.has(String(g.awayTeamId)))byTeam.set(String(g.awayTeamId),byTeam.get(String(g.awayTeamId))+1);
 }
 for(const [id,count] of byTeam)if(count===0)issues.push({code:'TEAM_WITHOUT_GAMES',teamId:id});
 const snapshot=Object.freeze({...base.snapshot,controlledTeamId:owner??null,currentDate:date??null,scheduledTeams:teams.length-[...byTeam.values()].filter(v=>v===0).length});
 return Object.freeze({ready:issues.length===0,issues:Object.freeze(issues),snapshot});
}
module.exports={auditPlayableLoop};
