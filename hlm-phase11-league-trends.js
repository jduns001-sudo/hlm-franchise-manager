'use strict';
/* Deterministic, read-only league form and franchise history projection. */
const {projectSeason}=require('./hlm-phase11-season-decision-history');
function projectLeagueTrends(state){
 const season=projectSeason(state),owner=season.controlledTeamId;
 const form=new Map();
 for(const game of season.history){
  const home=String(game.homeTeamId),away=String(game.awayTeamId);
  for(const id of [home,away])if(!form.has(id))form.set(id,[]);
  const hg=Number(game.homeGoals),ag=Number(game.awayGoals);
  form.get(home).push({gameId:game.id,result:hg>ag?'W':hg<ag?'L':'T'});
  form.get(away).push({gameId:game.id,result:ag>hg?'W':ag<hg?'L':'T'});
 }
 const teams=season.standings.map(team=>({...team,role:team.teamId===owner?'human-GM':'CPU',lastFive:(form.get(team.teamId)||[]).slice(-5)}));
 return {official:false,productionActivationEnabled:false,controlledTeamId:owner,teams,franchiseHistory:season.history.filter(g=>String(g.homeTeamId)===owner||String(g.awayTeamId)===owner),cpuHistory:season.history.filter(g=>String(g.homeTeamId)!==owner&&String(g.awayTeamId)!==owner)};
}
module.exports={projectLeagueTrends};
