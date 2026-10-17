/* Mission 1212: pure full-season balance, schedule chronology and multiday continuity checks. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./hlm-phase10-simulate-day'):null,typeof module==='object'&&module.exports?require('./hlm-phase10-standings'):null);if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMSeasonContinuity=api;})(typeof globalThis!=='undefined'?globalThis:this,function(sim,stand){
'use strict';
const clone=x=>JSON.parse(JSON.stringify(x));
function validate(state){
 if(!state||!state.meta||!state.universe||!state.activity||!Array.isArray(state.universe.teams)||!Array.isArray(state.activity.games))throw Error('Canonical staged franchise required');
 const teams=state.universe.teams,games=state.activity.games,ids=new Set(),teamIds=new Set();
 for(const t of teams){if(!t||t.id==null||teamIds.has(String(t.id)))throw Error('Invalid team identity');teamIds.add(String(t.id));}
 if(!teamIds.has(String(state.meta.controlledTeamId)))throw Error('Controlled team missing');
 if(!games.length)throw Error('Season schedule required');
 const pair=new Map(),home=new Map(),away=new Map();let last='';
 for(const g of games){
  if(!g||g.id==null||ids.has(String(g.id)))throw Error('Invalid game identity');
  ids.add(String(g.id));
  const h=String(g.homeTeamId),a=String(g.awayTeamId);
  if(!teamIds.has(h)||!teamIds.has(a)||h===a)throw Error('Invalid scheduled team mapping');
  if(typeof g.date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(g.date)||!Number.isFinite(Date.parse(g.date+'T00:00:00Z'))||g.date<last||g.date<=state.meta.currentDate)throw Error('Invalid season chronology');
  last=g.date;home.set(h,(home.get(h)||0)+1);away.set(a,(away.get(a)||0)+1);
  const key=[h,a].sort().join('|'),record=pair.get(key)||{first:0,second:0};if(h===key.split('|')[0])record.first++;else record.second++;pair.set(key,record);
 }
 for(const h of teamIds)for(const a of teamIds)if(h<a&&!pair.has([h,a].join('|')))throw Error('Incomplete season matchups');
 for(const p of pair.values())if(Math.abs(p.first-p.second)>1)throw Error('Unbalanced head-to-head home/away');
 for(const id of teamIds)if(Math.abs((home.get(id)||0)-(away.get(id)||0))>1)throw Error('Unbalanced team home/away');
 return {kind:'experimental-season-continuity',controlledTeamId:state.meta.controlledTeamId,teamCount:teams.length,gameCount:games.length,firstGameDate:games[0].date,lastGameDate:last,balanced:true,productionActivationAllowed:false,persistencePerformed:false,gmApprovalStillRequired:true};
}
function simulatePreview(state,days,approved,adapter){
 if(approved!==true)throw Error('Explicit GM approval required');
 if(!Number.isSafeInteger(days)||days<1||days>366)throw Error('Days must be 1 to 366');
 const summary=validate(state);
 const simulate=(adapter&&adapter.simulateNextDay)||(sim&&sim.simulateNextDay)||(typeof globalThis!=='undefined'&&globalThis.HLMPhase10&&globalThis.HLMPhase10.simulateNextDay);
 const standings=(adapter&&adapter.calculateStandings)||(stand&&stand.calculateStandings)||(typeof globalThis!=='undefined'&&globalThis.HLMPhase10&&globalThis.HLMPhase10.calculateStandings);
 if(typeof simulate!=='function'||typeof standings!=='function')throw Error('Phase 10 simulation adapters required');
 let candidate=clone(state);const dates=[],owner=String(state.meta.controlledTeamId);
 for(let i=0;i<days;i++){
  const seed=Number(candidate.meta.currentDate.replaceAll('-',''))+i;
  const step=simulate(candidate,seed);if(step.toDate===candidate.meta.currentDate||String(step.nextState.meta.controlledTeamId)!==owner)throw Error('Date or controlled-team continuity broken');
  candidate=step.nextState;dates.push(step.toDate);
 }
 const table=standings(candidate.universe.teams,candidate.activity.games);
 if(!table.some(t=>String(t.teamId)===owner))throw Error('Controlled-team standings missing');
 return {kind:'experimental-season-simulation-preview',fromDate:state.meta.currentDate,toDate:candidate.meta.currentDate,days,dates,controlledTeamId:state.meta.controlledTeamId,standings:table,completedGames:candidate.activity.games.filter(g=>g.status==='final').length,gameCount:summary.gameCount,productionActivationAllowed:false,persistencePerformed:false,gmApprovalStillRequired:true};
}
return {validate,simulatePreview};
});
