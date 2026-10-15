/* Experimental read-only browser projection; no storage access. */
(function(global){'use strict';const module={exports:{}};
'use strict';
/* Experimental read-only season decision and history projections.
   No storage access, production activation, or automatic GM actions. */
function projectSeason(state){
 if(!state||!state.meta||!state.activity||!Array.isArray(state.activity.games))throw Error('Invalid isolated season');
 const controlledTeamId=String(state.meta.controlledTeamId);
 const schedule=[],history=[],standings=new Map();
 const ensure=id=>{id=String(id);if(!standings.has(id))standings.set(id,{teamId:id,gp:0,w:0,l:0,t:0,gf:0,ga:0,points:0});return standings.get(id)};
 for(const game of state.activity.games){
  if(!game||game.homeTeamId==null||game.awayTeamId==null)continue;
  const home=String(game.homeTeamId),away=String(game.awayTeamId);
  if(home===away)continue;
  const entry={id:game.id,date:game.date,homeTeamId:home,awayTeamId:away,status:game.status};
  if(game.status!=='final'){schedule.push(entry);continue}
  const hg=Number(game.homeGoals),ag=Number(game.awayGoals);
  if(!Number.isSafeInteger(hg)||!Number.isSafeInteger(ag)||hg<0||ag<0)continue;
  const h=ensure(home),a=ensure(away);
  h.gp++;a.gp++;h.gf+=hg;h.ga+=ag;a.gf+=ag;a.ga+=hg;
  if(hg>ag){h.w++;h.points+=2;a.l++}
  else if(ag>hg){a.w++;a.points+=2;h.l++}
  else {h.t++;a.t++;h.points++;a.points++}
  history.push({...entry,homeGoals:hg,awayGoals:ag});
 }
 const table=[...standings.values()].sort((a,b)=>b.points-a.points||(b.gf-b.ga)-(a.gf-a.ga)||a.teamId.localeCompare(b.teamId));
 const upcoming=schedule.filter(g=>g.homeTeamId===controlledTeamId||g.awayTeamId===controlledTeamId).sort((a,b)=>String(a.date).localeCompare(String(b.date)));
 const decisions=[{id:'review-next-game',type:'lineup-review',teamId:controlledTeamId,gameId:upcoming[0]?.id??null,requiresGMApproval:true,status:'pending',description:upcoming.length?'Review lineup before the next scheduled game':'Review roster and season objectives'}];
 return {official:false,productionActivationEnabled:false,controlledTeamId,currentDate:state.meta.currentDate,schedule,history,standings:table,decisions};
}
module.exports={projectSeason};

global.HLMPhase11SeasonDecisionHistory=module.exports;
})(typeof window!=='undefined'?window:globalThis);
