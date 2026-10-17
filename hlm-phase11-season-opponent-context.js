/* Mission 1216: opponent context and venue splits for isolated evidence only. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./hlm-phase11-season-progression-evidence'):null,typeof module==='object'&&module.exports?require('./hlm-phase11-season-performance-trends'):null);if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMSeasonOpponentContext=api;})(typeof globalThis!=='undefined'?globalThis:this,function(progression,trends){
'use strict';
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
function summarize(report){
 if(!report||report.kind!=='experimental-season-progression-evidence'||report.standingsIntegrity!==true||!Array.isArray(report.controlledTeamGames)||!Array.isArray(report.standingsSnapshots)||!Number.isSafeInteger(report.teamCount)||report.teamCount<2)throw Error('Validated progression evidence required');
 const baseline=(trends||(typeof globalThis!=='undefined'&&globalThis.HLMSeasonPerformanceTrends)).summarize(report);
 const games=report.controlledTeamGames,seen=new Set(),groups={home:[],away:[]},opponents=new Map();
 for(const g of games){
  if(!g||!['home','away'].includes(g.venue)||!['win','loss','tie'].includes(g.outcome)||!Number.isSafeInteger(g.goalsFor)||!Number.isSafeInteger(g.goalsAgainst)||g.goalsFor<0||g.goalsAgainst<0||!g.id||seen.has(String(g.id))||g.opponentTeamId==null||String(g.opponentTeamId)===String(report.controlledTeamId)||g.outcome!==(g.goalsFor>g.goalsAgainst?'win':g.goalsFor<g.goalsAgainst?'loss':'tie'))throw Error('Invalid controlled-team game evidence');
  seen.add(String(g.id));groups[g.venue].push(g);
  const key=String(g.opponentTeamId);if(!opponents.has(key))opponents.set(key,[]);opponents.get(key).push(g);
 }
 const split=arr=>({games:arr.length,wins:arr.filter(g=>g.outcome==='win').length,losses:arr.filter(g=>g.outcome==='loss').length,ties:arr.filter(g=>g.outcome==='tie').length,goalsFor:arr.reduce((n,g)=>n+g.goalsFor,0),goalsAgainst:arr.reduce((n,g)=>n+g.goalsAgainst,0),winRate:arr.length?arr.filter(g=>g.outcome==='win').length/arr.length:null});
 const venue={home:split(groups.home),away:split(groups.away)};
 const context=[...opponents].sort(([a],[b])=>a.localeCompare(b,undefined,{numeric:true})).map(([id,arr])=>({opponentTeamId:id,...split(arr),strength:'unknown',strengthConfidence:'insufficient',reason:'Opponent standings are not present in controlled-team-only snapshots; relative opponent strength cannot be inferred safely'}));
 const snapshots=report.standingsSnapshots;let prevDate='',prevGp=-1;for(const s of snapshots){if(!s||typeof s.date!=='string'||s.date<=prevDate||!s.controlledTeam||!Number.isSafeInteger(s.controlledTeam.gp)||s.controlledTeam.gp<prevGp||s.leagueGamesPlayed!==2*s.completedGames||s.leagueGoalsFor!==s.leagueGoalsAgainst)throw Error('Invalid chronology or standings integrity');prevDate=s.date;prevGp=s.controlledTeam.gp}
 const initialGp=snapshots.length?snapshots[0].controlledTeam.gp:0,finalGp=snapshots.length?snapshots[snapshots.length-1].controlledTeam.gp:0;
 if(games.length>finalGp||baseline.record.wins+baseline.record.losses+baseline.record.ties!==games.length||venue.home.games+venue.away.games!==games.length)throw Error('Game evidence count mismatch');
 const venueConfidence=Math.min(venue.home.games,venue.away.games)>=10?'moderate':Math.min(venue.home.games,venue.away.games)>=5?'limited':'insufficient';
 const diff=venue.home.winRate!==null&&venue.away.winRate!==null?venue.home.winRate-venue.away.winRate:null;
 return {kind:'experimental-season-opponent-context',controlledTeamId:report.controlledTeamId,teamCount:report.teamCount,gameCount:games.length,venueSplits:venue,homeAwayWinRateDifference:diff,homeAwayConfidence:venueConfidence,opponents:context,opponentStrengthAvailable:false,evidenceQuality:{validatedUniqueGames:seen.size,chronologicalSnapshots:snapshots.length,venueCoverageComplete:true,standingsIntegrity:true,opponentStrengthDataAvailable:false},explanations:[{claim:'Home and away splits reflect observed simulated controlled-team scores, not causal home-ice advantage',confidence:venueConfidence,evidenceGames:games.length},{claim:'Opponent-strength classification withheld: opponent standings and pre-game rankings are unavailable in this evidence format',confidence:'insufficient',evidenceOpponents:context.length},{claim:'Opponent results are grouped by stable opponent identifiers and checked against season evidence',confidence:'high',evidenceGames:games.length}],productionActivationAllowed:false,persistencePerformed:false,gmApprovalStillRequired:true};
}
function analyze(state,days,approved,adapter){if(approved!==true)throw Error('Explicit human GM approval required');const p=progression||(typeof globalThis!=='undefined'&&globalThis.HLMSeasonProgressionEvidence);return summarize(p.analyze(state,days,true,adapter))}
return {summarize,analyze};
});
