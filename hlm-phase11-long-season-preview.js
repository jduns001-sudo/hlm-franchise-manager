/* Mission 1213: deterministic long-season, controlled-team and standings integrity preview. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./hlm-phase11-season-continuity'):null,typeof module==='object'&&module.exports?require('./hlm-phase10-simulate-day'):null,typeof module==='object'&&module.exports?require('./hlm-phase10-standings'):null);if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMLongSeasonPreview=api;})(typeof globalThis!=='undefined'?globalThis:this,function(continuity,simulation,standingsModule){
'use strict';
const copy=x=>JSON.parse(JSON.stringify(x));
function preview(state,days,approved,adapter){
 if(approved!==true)throw Error('Explicit human GM approval required');
 if(!Number.isSafeInteger(days)||days<1||days>366)throw Error('Days must be between 1 and 366');
 const continuityApi=continuity||(typeof globalThis!=='undefined'&&globalThis.HLMSeasonContinuity);
 const base=continuityApi.validate(state);
 const simulate=(adapter&&adapter.simulateNextDay)||(simulation&&simulation.simulateNextDay)||(typeof globalThis!=='undefined'&&globalThis.HLMPhase10&&globalThis.HLMPhase10.simulateNextDay);
 const standings=(adapter&&adapter.calculateStandings)||(standingsModule&&standingsModule.calculateStandings)||(typeof globalThis!=='undefined'&&globalThis.HLMPhase10&&globalThis.HLMPhase10.calculateStandings);
 if(typeof simulate!=='function'||typeof standings!=='function')throw Error('Phase 10 simulation adapters unavailable');
 let candidate=copy(state);const owner=String(state.meta.controlledTeamId),start=state.meta.currentDate;
 const games=candidate.activity.games,initialFinal=games.filter(g=>g.status==='final').length,played=[],dates=[];
 for(let i=0;i<days;i++){
  const previous=candidate.meta.currentDate,seed=Number(previous.replace(/-/g,''))+i;
  const step=simulate(candidate,seed);
  if(!step||!step.nextState||step.fromDate!==previous||step.toDate<=previous||step.nextState.meta.currentDate!==step.toDate||String(step.nextState.meta.controlledTeamId)!==owner)throw Error('Controlled team or chronological day continuity failed');
  candidate=step.nextState;dates.push(step.toDate);
  for(const g of candidate.activity.games.filter(g=>g.date===step.toDate&&g.status==='final')){
   if(!played.some(x=>String(x.id)===String(g.id)))played.push({id:g.id,date:g.date,homeTeamId:g.homeTeamId,awayTeamId:g.awayTeamId,homeGoals:g.homeGoals,awayGoals:g.awayGoals,overtime:!!g.overtime});
  }
 }
 const table=standings(candidate.universe.teams,candidate.activity.games);
 const final=candidate.activity.games.filter(g=>g.status==='final');
 const totalGp=table.reduce((n,t)=>n+t.gp,0),totalGoals=table.reduce((n,t)=>n+t.gf,0),against=table.reduce((n,t)=>n+t.ga,0);
 if(totalGp!==2*final.length||totalGoals!==against||table.length!==base.teamCount)throw Error('Standings integrity mismatch');
 const ownerResults=played.filter(g=>String(g.homeTeamId)===owner||String(g.awayTeamId)===owner);
 const ownerRow=table.find(t=>String(t.teamId)===owner);
 if(!ownerRow||ownerRow.gp!==final.filter(g=>String(g.homeTeamId)===owner||String(g.awayTeamId)===owner).length)throw Error('Controlled team standings continuity mismatch');
 return {kind:'experimental-long-season-preview',fromDate:start,toDate:candidate.meta.currentDate,days,teamCount:base.teamCount,scheduledGames:base.gameCount,completedGames:final.length,initialCompletedGames:initialFinal,simulatedGames:played.length,controlledTeamId:state.meta.controlledTeamId,controlledTeamResults:ownerResults,controlledTeamStandings:ownerRow,standings:table,standingsIntegrity:true,dates,productionActivationAllowed:false,persistencePerformed:false,gmApprovalStillRequired:true};
}
return {preview};
});
