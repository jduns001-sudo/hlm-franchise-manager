/* Mission 1214: deterministic game-by-game and standings progression evidence; no persistence. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./hlm-phase11-season-continuity'):null,typeof module==='object'&&module.exports?require('./hlm-phase10-simulate-day'):null,typeof module==='object'&&module.exports?require('./hlm-phase10-standings'):null);if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMSeasonProgressionEvidence=api;})(typeof globalThis!=='undefined'?globalThis:this,function(continuity,sim,stand){
'use strict';
const clone=x=>JSON.parse(JSON.stringify(x));
function analyze(state,days,approved,adapter){
 if(approved!==true)throw Error('Explicit human GM approval required');
 if(!Number.isSafeInteger(days)||days<1||days>366)throw Error('Days must be between 1 and 366');
 const validation=(continuity||(typeof globalThis!=='undefined'&&globalThis.HLMSeasonContinuity)).validate(state);
 const simulate=(adapter&&adapter.simulateNextDay)||(sim&&sim.simulateNextDay)||(typeof globalThis!=='undefined'&&globalThis.HLMPhase10&&globalThis.HLMPhase10.simulateNextDay);
 const standings=(adapter&&adapter.calculateStandings)||(stand&&stand.calculateStandings)||(typeof globalThis!=='undefined'&&globalThis.HLMPhase10&&globalThis.HLMPhase10.calculateStandings);
 if(typeof simulate!=='function'||typeof standings!=='function')throw Error('Phase 10 simulation adapters required');
 let candidate=clone(state);const owner=String(state.meta.controlledTeamId),snapshots=[],ownerGames=[];
 for(let i=0;i<days;i++){
  const prior=candidate.meta.currentDate,seed=Number(prior.replace(/-/g,''))+i;
  const step=simulate(candidate,seed);
  if(!step||step.fromDate!==prior||step.toDate<=prior||!step.nextState||step.nextState.meta.currentDate!==step.toDate||String(step.nextState.meta.controlledTeamId)!==owner)throw Error('Simulation continuity broken');
  candidate=step.nextState;
  const allFinal=candidate.activity.games.filter(g=>g.status==='final'),table=standings(candidate.universe.teams,candidate.activity.games);
  if(table.length!==validation.teamCount||table.reduce((s,r)=>s+r.gp,0)!==allFinal.length*2||table.reduce((s,r)=>s+r.gf,0)!==table.reduce((s,r)=>s+r.ga,0))throw Error('Standings progression integrity failed');
  const row=table.find(r=>String(r.teamId)===owner);
  if(!row||row.gp!==allFinal.filter(g=>String(g.homeTeamId)===owner||String(g.awayTeamId)===owner).length)throw Error('Controlled team standings mismatch');
  const newGames=allFinal.filter(g=>g.date===step.toDate&&(String(g.homeTeamId)===owner||String(g.awayTeamId)===owner));
  for(const g of newGames){
   const home=String(g.homeTeamId)===owner,forGoals=home?g.homeGoals:g.awayGoals,againstGoals=home?g.awayGoals:g.homeGoals;
   if(!Number.isFinite(forGoals)||!Number.isFinite(againstGoals))throw Error('Invalid game score evidence');
   ownerGames.push({id:g.id,date:g.date,opponentTeamId:home?g.awayTeamId:g.homeTeamId,venue:home?'home':'away',goalsFor:forGoals,goalsAgainst:againstGoals,outcome:forGoals>againstGoals?'win':forGoals<againstGoals?'loss':'tie',overtime:!!g.overtime});
  }
  snapshots.push({date:step.toDate,completedGames:allFinal.length,controlledTeam:{...row},leagueGamesPlayed:table.reduce((s,r)=>s+r.gp,0),leagueGoalsFor:table.reduce((s,r)=>s+r.gf,0),leagueGoalsAgainst:table.reduce((s,r)=>s+r.ga,0)});
 }
 const last=snapshots[snapshots.length-1],total=last.completedGames;
 if(ownerGames.length!==last.controlledTeam.gp-state.activity.games.filter(g=>g.status==='final'&&(String(g.homeTeamId)===owner||String(g.awayTeamId)===owner)).length)throw Error('Controlled team result count mismatch');
 return {kind:'experimental-season-progression-evidence',fromDate:state.meta.currentDate,toDate:last.date,days,teamCount:validation.teamCount,scheduledGames:validation.gameCount,completedGames:total,controlledTeamId:state.meta.controlledTeamId,controlledTeamGames:ownerGames,standingsSnapshots:snapshots,finalControlledTeamStandings:last.controlledTeam,standingsIntegrity:true,deterministicSeedPolicy:'date-plus-day-index',productionActivationAllowed:false,persistencePerformed:false,gmApprovalStillRequired:true};
}
return {analyze};
});
