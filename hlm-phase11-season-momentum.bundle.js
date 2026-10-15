/* Experimental read-only season momentum browser projection. */
(function(global){'use strict';const module={exports:{}};const require=(path)=>{if(path==='./hlm-phase11-league-trends')return global.HLMPhase11LeagueTrends;throw Error('Unsupported module')};
'use strict';
/* Advisory-only momentum derived from saved final games; no writes or GM actions. */
const {projectLeagueTrends}=require('./hlm-phase11-league-trends');
function projectMomentum(state){
 const league=projectLeagueTrends(state);
 const teams=league.teams.map(t=>{
  const recent=t.lastFive;
  const wins=recent.filter(g=>g.result==='W').length;
  const losses=recent.filter(g=>g.result==='L').length;
  const ties=recent.filter(g=>g.result==='T').length;
  const streak=recent.length?recent[recent.length-1].result:'-';
  let streakLength=0;
  for(let i=recent.length-1;i>=0&&recent[i].result===streak;i--)streakLength++;
  return {teamId:t.teamId,role:t.role,gamesSampled:recent.length,wins,losses,ties,streak,streakLength,form:recent.map(g=>g.result).join(''),requiresGMApproval:t.role==='human-GM'};
 });
 return {official:false,productionActivationEnabled:false,controlledTeamId:league.controlledTeamId,teams,advisoryOnly:true};
}
module.exports={projectMomentum};

global.HLMPhase11SeasonMomentum=module.exports;
})(typeof window!=='undefined'?window:globalThis);
