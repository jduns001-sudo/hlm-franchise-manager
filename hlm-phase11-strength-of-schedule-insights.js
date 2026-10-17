/* Mission 1218: pre-game strength-of-schedule insights; in-memory and human-approved. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./hlm-phase11-league-standings-evidence'):null,typeof module==='object'&&module.exports?require('./hlm-phase11-season-progression-evidence'):null,typeof module==='object'&&module.exports?require('./hlm-phase11-season-performance-trends'):null);if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMStrengthOfScheduleInsights=api;})(typeof globalThis!=='undefined'?globalThis:this,function(league,progression,trends){
'use strict';
function summarize(l,p){
 if(!l||l.kind!=='experimental-league-standings-evidence'||!l.evidenceQuality||l.evidenceQuality.preGameOnly!==true||l.evidenceQuality.standingsIntegrity!==true||!Array.isArray(l.opponentEncounters)||!Array.isArray(l.leagueStandingsSnapshots))throw Error('Validated pre-game league evidence required');
 if(!p||p.kind!=='experimental-season-progression-evidence'||p.standingsIntegrity!==true||String(l.controlledTeamId)!==String(p.controlledTeamId)||l.teamCount!==p.teamCount)throw Error('Controlled-team evidence mismatch');
 const baseline=(trends||(typeof globalThis!=='undefined'&&globalThis.HLMSeasonPerformanceTrends)).summarize(p);
 const games=p.controlledTeamGames,encounters=l.opponentEncounters;
 if(encounters.length!==games.length)throw Error('Opponent encounter count mismatch');
 const byId=new Map();for(const g of games){if(!g||g.id==null||byId.has(String(g.id)))throw Error('Duplicate controlled-team game');byId.set(String(g.id),g)}
 const matched=new Set(),groups={higher:[],lower:[],equal:[],unclassified:[]},valid=[];
 for(const e of encounters){
  if(!e||e.gameId==null||matched.has(String(e.gameId))||e.usesFutureResults!==false||!['moderate','limited','insufficient'].includes(e.confidence)||!e.opponentPreGame||!e.ownerPreGame)throw Error('Invalid or hindsight-biased opponent evidence');
  const g=byId.get(String(e.gameId));if(!g||e.date!==g.date||String(e.opponentTeamId)!==String(g.opponentTeamId))throw Error('Encounter game mismatch');
  matched.add(String(e.gameId));
  const op=e.opponentPreGame,own=e.ownerPreGame;
  for(const r of [op,own])if(!Number.isSafeInteger(r.gamesPlayed)||r.gamesPlayed<0||!Number.isSafeInteger(r.points)||r.points<0||r.points>2*r.gamesPlayed||r.pointsPerGame!==(r.gamesPlayed?r.points/r.gamesPlayed:null))throw Error('Invalid pre-game points evidence');
  const sufficient=op.gamesPlayed>=5&&own.gamesPlayed>=5;
  const classification=!sufficient?'unclassified':op.pointsPerGame>own.pointsPerGame?'higher-pre-game-ppg':op.pointsPerGame<own.pointsPerGame?'lower-pre-game-ppg':'equal-pre-game-ppg';
  if(e.relativeStrength!==classification||(!sufficient&&e.confidence!=='insufficient')||(sufficient&&e.confidence==='insufficient'))throw Error('Unsupported opponent strength classification');
  const bucket=!sufficient?'unclassified':classification.startsWith('higher')?'higher':classification.startsWith('lower')?'lower':'equal';
  groups[bucket].push(g);
  if(sufficient)valid.push({game:g,encounter:e});
 }
 const split=arr=>({games:arr.length,wins:arr.filter(g=>g.outcome==='win').length,losses:arr.filter(g=>g.outcome==='loss').length,ties:arr.filter(g=>g.outcome==='tie').length,winRate:arr.length?arr.filter(g=>g.outcome==='win').length/arr.length:null});
 const weighted=valid.length?valid.reduce((s,x)=>s+x.encounter.opponentPreGame.pointsPerGame,0)/valid.length:null;
 const recent=valid.filter(x=>games.slice(-10).includes(x.game)),prior=valid.filter(x=>games.slice(-20,-10).includes(x.game));
 const avg=a=>a.length?a.reduce((s,x)=>s+x.encounter.opponentPreGame.pointsPerGame,0)/a.length:null;
 const recentPpg=avg(recent),priorPpg=avg(prior),completeWindows=recent.length===10&&prior.length===10;
 const direction=!completeWindows?'insufficient-comparison':recentPpg>priorPpg?'tougher':recentPpg<priorPpg?'easier':'stable';
 const confidence=valid.length>=20&&valid.every(x=>x.encounter.confidence==='moderate')?'moderate':valid.length>=5?'limited':'insufficient';
 return {kind:'experimental-strength-of-schedule-insights',controlledTeamId:l.controlledTeamId,gameCount:games.length,classifiedGames:valid.length,unclassifiedGames:groups.unclassified.length,preGameOpponentPointsPerGame:weighted,performanceByOpponentStrength:{higher:split(groups.higher),lower:split(groups.lower),equal:split(groups.equal),unclassified:split(groups.unclassified)},recentSchedule:{lastTenOpponentPpg:recentPpg,previousTenOpponentPpg:priorPpg,direction,confidence:completeWindows?confidence:'insufficient'},controlledTeamForm:baseline.recentForm,confidence,explanations:[{claim:'Opponent strength uses points per game measured before each simulated game; future standings are excluded',confidence:'high',evidenceGames:games.length},{claim:completeWindows?'Recent and prior ten-game schedule strength compared using pre-game opponent records':'Schedule-strength trend withheld because two complete ten-game classified windows are unavailable',confidence:completeWindows?confidence:'insufficient',evidenceGames:recent.length+prior.length},{claim:'Performance by opponent strength is descriptive, not a causal explanation for wins or losses',confidence,evidenceGames:valid.length}],productionActivationAllowed:false,persistencePerformed:false,gmApprovalStillRequired:true};
}
function analyze(state,days,approved,adapter){if(approved!==true)throw Error('Explicit human GM approval required');const a=league||(typeof globalThis!=='undefined'&&globalThis.HLMLeagueStandingsEvidence),b=progression||(typeof globalThis!=='undefined'&&globalThis.HLMSeasonProgressionEvidence);return summarize(a.analyze(state,days,true,adapter),b.analyze(state,days,true,adapter))}
return {summarize,analyze};
});
