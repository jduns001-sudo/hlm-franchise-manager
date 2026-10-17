/* Mission 1217: pre-game league standings evidence; no hindsight, no persistence. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./hlm-phase11-season-continuity'):null,typeof module==='object'&&module.exports?require('./hlm-phase10-simulate-day'):null,typeof module==='object'&&module.exports?require('./hlm-phase10-standings'):null);if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMLeagueStandingsEvidence=api;})(typeof globalThis!=='undefined'?globalThis:this,function(continuity,sim,stand){
'use strict';
const clone=x=>JSON.parse(JSON.stringify(x));
function analyze(state,days,approved,adapter){
 if(approved!==true)throw Error('Explicit human GM approval required');
 if(!Number.isSafeInteger(days)||days<1||days>366)throw Error('Days must be 1 to 366');
 const validate=continuity||(typeof globalThis!=='undefined'&&globalThis.HLMSeasonContinuity),info=validate.validate(state);
 const simulate=(adapter&&adapter.simulateNextDay)||(sim&&sim.simulateNextDay)||(typeof globalThis!=='undefined'&&globalThis.HLMPhase10&&globalThis.HLMPhase10.simulateNextDay);
 const standings=(adapter&&adapter.calculateStandings)||(stand&&stand.calculateStandings)||(typeof globalThis!=='undefined'&&globalThis.HLMPhase10&&globalThis.HLMPhase10.calculateStandings);
 if(typeof simulate!=='function'||typeof standings!=='function')throw Error('Simulation adapters required');
 const owner=String(state.meta.controlledTeamId),teamIds=new Set(state.universe.teams.map(t=>String(t.id))),snapshot=[],encounters=[];
 let candidate=clone(state);
 const check=(table,games)=>{const finals=games.filter(g=>g.status==='final');if(table.length!==info.teamCount||table.reduce((n,r)=>n+r.gp,0)!==2*finals.length||table.reduce((n,r)=>n+r.gf,0)!==table.reduce((n,r)=>n+r.ga,0)||new Set(table.map(r=>String(r.teamId))).size!==info.teamCount||table.some(r=>!teamIds.has(String(r.teamId))||!Number.isSafeInteger(r.gp)||r.gp<0||!Number.isFinite(r.points)))throw Error('League standings integrity failed');return table.map((r,i)=>({...r,rank:i+1,pointsPerGame:r.gp?r.points/r.gp:null}))};
 for(let day=0;day<days;day++){
  const beforeDate=candidate.meta.currentDate,pre=check(standings(candidate.universe.teams,candidate.activity.games),candidate.activity.games);
  const preById=new Map(pre.map(r=>[String(r.teamId),r])),seed=Number(beforeDate.replace(/-/g,''))+day,step=simulate(candidate,seed);
  if(!step||step.fromDate!==beforeDate||step.toDate<=beforeDate||!step.nextState||step.nextState.meta.currentDate!==step.toDate||String(step.nextState.meta.controlledTeamId)!==owner)throw Error('Simulation continuity broken');
  candidate=step.nextState;const finals=candidate.activity.games.filter(g=>g.status==='final'),post=check(standings(candidate.universe.teams,candidate.activity.games),candidate.activity.games);
  const played=finals.filter(g=>g.date===step.toDate&&(String(g.homeTeamId)===owner||String(g.awayTeamId)===owner));
  for(const g of played){
   const opponentId=String(g.homeTeamId)===owner?String(g.awayTeamId):String(g.homeTeamId),op=preById.get(opponentId),self=preById.get(owner);
   if(!op||!self)throw Error('Opponent missing from pre-game standings');
   const strength=op.gp<5?'unclassified':op.pointsPerGame>self.pointsPerGame?'higher-pre-game-ppg':op.pointsPerGame<self.pointsPerGame?'lower-pre-game-ppg':'equal-pre-game-ppg';
   const confidence=op.gp>=20&&self.gp>=20?'moderate':op.gp>=5&&self.gp>=5?'limited':'insufficient';
   encounters.push({gameId:g.id,date:g.date,opponentTeamId:op.teamId,opponentPreGame:{gamesPlayed:op.gp,points:op.points,pointsPerGame:op.pointsPerGame,rank:op.rank},ownerPreGame:{gamesPlayed:self.gp,points:self.points,pointsPerGame:self.pointsPerGame,rank:self.rank},relativeStrength:confidence==='insufficient'?'unclassified':strength,confidence,method:'pre-game points per game, minimum five games each',usesFutureResults:false});
  }
  snapshot.push({date:step.toDate,league:post,completedGames:finals.length,controlledTeamRank:post.find(r=>String(r.teamId)===owner).rank});
 }
 return {kind:'experimental-league-standings-evidence',controlledTeamId:state.meta.controlledTeamId,teamCount:info.teamCount,days,leagueStandingsSnapshots:snapshot,opponentEncounters:encounters,comparisonPolicy:'pre-game-only; five games minimum; no future results',evidenceQuality:{completeLeagueSnapshots:true,standingsIntegrity:true,preGameOnly:true},productionActivationAllowed:false,persistencePerformed:false,gmApprovalStillRequired:true};
}
return {analyze};
});
