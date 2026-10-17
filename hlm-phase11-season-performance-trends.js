/* Mission 1215: explanatory trends over isolated, GM-approved season progression evidence. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./hlm-phase11-season-progression-evidence'):null);if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMSeasonPerformanceTrends=api;})(typeof globalThis!=='undefined'?globalThis:this,function(progression){
'use strict';
function summarize(report){
 if(!report||report.kind!=='experimental-season-progression-evidence'||report.standingsIntegrity!==true||!Array.isArray(report.controlledTeamGames)||!Array.isArray(report.standingsSnapshots))throw Error('Validated season progression evidence required');
 const games=report.controlledTeamGames,snapshots=report.standingsSnapshots;
 const runs=[];let current=null;
 for(const g of games){if(!['win','loss','tie'].includes(g.outcome)||!Number.isFinite(g.goalsFor)||!Number.isFinite(g.goalsAgainst))throw Error('Invalid game evidence');if(current&&current.type===g.outcome){current.length++;current.endDate=g.date}else{current={type:g.outcome,length:1,startDate:g.date,endDate:g.date};runs.push(current)}}
 const streak=runs.length?runs[runs.length-1]:null;
 const longestWin=runs.filter(r=>r.type==='win').reduce((n,r)=>Math.max(n,r.length),0),longestLoss=runs.filter(r=>r.type==='loss').reduce((n,r)=>Math.max(n,r.length),0);
 const wins=games.filter(g=>g.outcome==='win').length,losses=games.filter(g=>g.outcome==='loss').length,ties=games.length-wins-losses;
 const gf=games.reduce((n,g)=>n+g.goalsFor,0),ga=games.reduce((n,g)=>n+g.goalsAgainst,0);
 const recent=games.slice(-10),prior=games.slice(-20,-10);
 const rate=a=>a.length?a.filter(g=>g.outcome==='win').length/a.length:null;
 const recentRate=rate(recent),priorRate=rate(prior),trend=priorRate===null?'insufficient-comparison':recentRate>priorRate?'improving':recentRate<priorRate?'declining':'stable';
 const movement=[];let previous=null;
 for(const s of snapshots){if(!s||!s.controlledTeam||!Number.isFinite(s.controlledTeam.gp)||s.leagueGamesPlayed!==2*s.completedGames||s.leagueGoalsFor!==s.leagueGoalsAgainst)throw Error('Invalid standings snapshot evidence');const row=s.controlledTeam;if(previous&&row.gp<previous.gp)throw Error('Games played moved backwards');movement.push({date:s.date,gamesPlayed:row.gp,points:row.points,pointsChange:previous&&Number.isFinite(row.points)&&Number.isFinite(previous.points)?row.points-previous.points:null,goalDifferential:row.gf-row.ga});previous=row}
 const sample=games.length,confidence=sample>=20&&prior.length===10?'moderate':sample>=10?'limited':'insufficient';
 const explanations=[{claim:'Controlled-team results are derived from simulated final scores',confidence:'high',evidenceGames:sample},{claim:trend==='insufficient-comparison'?'Not enough games for two ten-game windows':trend==='improving'?'Recent ten-game win rate exceeds the previous ten':trend==='declining'?'Recent ten-game win rate trails the previous ten':'Recent and previous ten-game win rates are equal',confidence:confidence,evidenceGames:recent.length+prior.length},{claim:'Standings movement uses daily league-integrity-checked snapshots; points changes are shown only when points are available',confidence:'high',evidenceDays:snapshots.length}];
 return {kind:'experimental-season-performance-trends',controlledTeamId:report.controlledTeamId,teamCount:report.teamCount,games:sample,record:{wins,losses,ties,goalsFor:gf,goalsAgainst:ga,goalDifferential:gf-ga},streaks:{current:streak,longestWin,longestLoss,runs},recentForm:{lastTenWinRate:recentRate,previousTenWinRate:priorRate,direction:trend,confidence},standingsMovement:movement,explanations,productionActivationAllowed:false,persistencePerformed:false,gmApprovalStillRequired:true};
}
function analyze(state,days,approved,adapter){if(approved!==true)throw Error('Explicit human GM approval required');const api=progression||(typeof globalThis!=='undefined'&&globalThis.HLMSeasonProgressionEvidence);return summarize(api.analyze(state,days,true,adapter))}
return {summarize,analyze};
});
