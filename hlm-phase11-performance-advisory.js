'use strict';
/* Experimental performance advisory. Derived only from isolated season results. */
const {projectMomentum}=require('./hlm-phase11-season-momentum');
function buildPerformanceAdvisory(state){
 const momentum=projectMomentum(state);
 const owner=momentum.teams.find(t=>t.role==='human-GM')||null;
 const recommendations=[];
 if(owner&&owner.gamesSampled>=2){
  if(owner.losses>owner.wins)recommendations.push({type:'review-line-combinations',reason:'recent-losses-exceed-wins',priority:'high'});
  if(owner.streak==='L'&&owner.streakLength>=2)recommendations.push({type:'review-player-workload',reason:'consecutive-losses',priority:'normal'});
  if(owner.streak==='W'&&owner.streakLength>=2)recommendations.push({type:'maintain-current-approach',reason:'winning-streak',priority:'normal'});
 }
 return {official:false,productionActivationEnabled:false,controlledTeamId:momentum.controlledTeamId,ownerForm:owner,advisoryOnly:true,recommendations:recommendations.map(x=>({...x,requiresGMApproval:true,automaticallyApplied:false}))};
}
module.exports={buildPerformanceAdvisory};
