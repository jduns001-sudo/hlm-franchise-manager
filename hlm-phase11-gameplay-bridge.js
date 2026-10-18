/* Phase 11: isolated gameplay bridge, never reads or writes production saves. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMGameplayBridge=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const KEY='hlm-phase11-m1207-isolated-gameplay-v1';
function createBridge(engine,storage){
 if(!engine||!engine.createBrowserFranchiseSaveStore||!engine.calculateStandings)throw Error('Phase 10 simulation engine required');
 if(!storage||typeof storage.getItem!=='function'||typeof storage.setItem!=='function')throw Error('Storage adapter required');
 const store=engine.createBrowserFranchiseSaveStore(storage,KEY);
 function validate(state){
  if(!state||!state.meta||!state.universe||!Array.isArray(state.universe.teams)||!state.activity||!Array.isArray(state.activity.games))throw Error('Invalid GameState');
  const owner=state.universe.teams.find(t=>String(t.id)===String(state.meta.controlledTeamId));
  if(!owner)throw Error('Controlled team not found');
  if(typeof state.meta.currentDate!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(state.meta.currentDate))throw Error('Invalid date');
  const ids=new Set();
  for(const game of state.activity.games){
   if(!game||game.id==null||ids.has(String(game.id)))throw Error('Duplicate or missing game ID');
   ids.add(String(game.id));
   if(!state.universe.teams.some(t=>String(t.id)===String(game.homeTeamId))||!state.universe.teams.some(t=>String(t.id)===String(game.awayTeamId)))throw Error('Unknown game team');
  }
  return owner;
 }
 function summary(state){
  const owner=validate(state);
  const upcoming=state.activity.games.filter(g=>g.status==='scheduled').sort((a,b)=>String(a.date).localeCompare(String(b.date)))[0]||null;
  return {team:owner.name,date:state.meta.currentDate,nextGame:upcoming?{id:upcoming.id,date:upcoming.date,homeTeamId:upcoming.homeTeamId,awayTeamId:upcoming.awayTeamId}:null,completed:state.activity.games.filter(g=>g.status==='final').length,standings:engine.calculateStandings(state.universe.teams,state.activity.games)};
 }
 function load(){const s=store.load();if(s)validate(s);return s;}
 function importIsolated(state,approved){
  if(approved!==true)throw Error('Explicit GM confirmation required');
  validate(state);store.save(state);return summary(load());
 }
 function advance(approved,seed){
  if(approved!==true)throw Error('Explicit GM confirmation required');
  if(!Number.isSafeInteger(seed)||seed<0)throw Error('Invalid deterministic seed');
  const before=load();if(!before)throw Error('No isolated franchise loaded');
  if(!before.activity.games.some(g=>g.status==='scheduled'))throw Error('No scheduled games remain');
  const now=storage.getItem(KEY);
  if(now!==JSON.stringify(before))throw Error('Isolated save changed in another tab; reload before advancing');
  const result=store.advanceAndSave(seed);
  if(result.toDate===before.meta.currentDate)throw Error('Duplicate date advance refused');
  return {fromDate:result.fromDate,toDate:result.toDate,results:result.results,summary:summary(load())};
 }
 function reviewSimulationEvidence(adapter){
  if(!adapter||typeof adapter.adapt!=='function')throw Error('Read-only evidence adapter required');
  const state=load();if(!state)throw Error('No isolated franchise loaded');
  validate(state);
  const finals=state.activity.games.filter(g=>g.status==='final');
  if(!finals.length)throw Error('No completed isolated games available');
  const results=finals.map(g=>({gameId:g.id,homeTeamId:g.homeTeamId,awayTeamId:g.awayTeamId,homeGoals:g.homeGoals,awayGoals:g.awayGoals,winnerTeamId:g.winnerTeamId,status:g.status}));
  const evidence=adapter.adapt(results);
  return Object.freeze({kind:'isolated-gameplay-human-gm-evidence',controlledTeamId:state.meta.controlledTeamId,asOfDate:state.meta.currentDate,evidence,independentVerification:'pending',canExecute:false,productionActivationAllowed:false,persistencePerformed:false,automaticTransactionsAllowed:false,finalDecisionMaker:'human-gm'});
 }
 function reviewControlledTeamDecisions(adapter){
  const state=load();if(!state)throw Error('No isolated franchise loaded');
  const owner=validate(state),ownerId=String(owner.id);
  const evidence=reviewSimulationEvidence(adapter);
  const teamNames=new Map(state.universe.teams.map(t=>[String(t.id),String(t.name)]));
  const games=state.activity.games.filter(g=>g.status==='final'&&(String(g.homeTeamId)===ownerId||String(g.awayTeamId)===ownerId));
  const byId=new Map(games.map(g=>[String(g.id),g]));
  const relevant=evidence.evidence.results.filter(g=>byId.has(g.gameId));
  const wins=relevant.filter(g=>{const source=byId.get(g.gameId);return g.homeWon=== (String(source.homeTeamId)===ownerId)}).length;
  const goalsFor=relevant.reduce((sum,g)=>{const source=byId.get(g.gameId);return sum+(String(source.homeTeamId)===ownerId?g.homeGoals:g.awayGoals)},0);
  const goalsAgainst=relevant.reduce((sum,g)=>{const source=byId.get(g.gameId);return sum+(String(source.homeTeamId)===ownerId?g.awayGoals:g.homeGoals)},0);
  const next=state.activity.games.filter(g=>g.status==='scheduled'&&(String(g.homeTeamId)===ownerId||String(g.awayTeamId)===ownerId)).sort((a,b)=>String(a.date).localeCompare(String(b.date)))[0]||null;
  const recent=relevant.slice(-5).map(g=>{const source=byId.get(g.gameId),home=String(source.homeTeamId)===ownerId;return Object.freeze({opponent:teamNames.get(String(home?source.awayTeamId:source.homeTeamId)),venue:home?'home':'away',result:g.homeWon===home?'win':'loss',goalsFor:home?g.homeGoals:g.awayGoals,goalsAgainst:home?g.awayGoals:g.homeGoals})});
  return Object.freeze({kind:'experimental-controlled-team-decision-review',team:owner.name,asOfDate:state.meta.currentDate,completedGames:relevant.length,wins,losses:relevant.length-wins,goalsFor,goalsAgainst,recent:Object.freeze(recent),nextOpponent:next?teamNames.get(String(String(next.homeTeamId)===ownerId?next.awayTeamId:next.homeTeamId)):null,reviewQuestions:Object.freeze(['Review recent results and opponent context before making lineup decisions','Verify current roster, injuries and staff information independently before any action']),limitations:'Completed isolated game scores only; no verified roster, player performance, staff morale, injuries or independent evidence',independentVerification:'pending',canExecute:false,productionActivationAllowed:false,persistencePerformed:false,automaticTransactionsAllowed:false,finalDecisionMaker:'human-gm'});
 }
 function auditControlledTeamEvidence(adapter){
  const state=load();if(!state)throw Error('No isolated franchise loaded');
  const owner=validate(state),ownerId=String(owner.id);
  const review=reviewControlledTeamDecisions(adapter);
  const sourceGames=state.activity.games.filter(g=>g.status==='final'&&(String(g.homeTeamId)===ownerId||String(g.awayTeamId)===ownerId));
  const datePattern=/^\d{4}-\d{2}-\d{2}$/;
  const issues=[];
  for(const game of sourceGames){
   if(typeof game.date!=='string'||!datePattern.test(game.date)||Number.isNaN(Date.parse(game.date+'T00:00:00Z')))issues.push('Completed game has missing or invalid date');
   else if(game.date>state.meta.currentDate)issues.push('Completed game dated after franchise review date');
  }
  const scheduled=state.activity.games.filter(g=>g.status==='scheduled'&&(String(g.homeTeamId)===ownerId||String(g.awayTeamId)===ownerId));
  for(const game of scheduled){if(typeof game.date!=='string'||!datePattern.test(game.date)||Number.isNaN(Date.parse(game.date+'T00:00:00Z')))issues.push('Scheduled game has missing or invalid date')}
  const known=Object.freeze(['completed-game scores','controlled-team wins and losses','goals for and against','opponent identity and venue','next scheduled opponent when present']);
  const unknown=Object.freeze(['player-level contributions','current roster and line combinations','injuries and medical status','staff assessments and morale','independent source verification']);
  const uniqueIssues=Object.freeze([...new Set(issues)]);
  return Object.freeze({kind:'isolated-human-gm-evidence-acceptance',team:review.team,asOfDate:review.asOfDate,completedGames:review.completedGames,scheduledGames:scheduled.length,sourceCoverage:Object.freeze({completedGames:review.completedGames,datedCompletedGames:sourceGames.filter(g=>typeof g.date==='string'&&datePattern.test(g.date)&&!Number.isNaN(Date.parse(g.date+'T00:00:00Z'))).length,unverifiedFields:unknown.length}),supportedByIsolatedGameResults:known,requiresIndependentVerification:unknown,dataQualityIssues:uniqueIssues,readiness:uniqueIssues.length?'review-source-dates':'limited-score-evidence-only',humanReviewPrompt:'Confirm source dates, roster, player and staff evidence before making any decision',independentVerification:'pending',canExecute:false,productionActivationAllowed:false,persistencePerformed:false,automaticTransactionsAllowed:false,finalDecisionMaker:'human-gm'});
 }
 return {key:KEY,summary,load,importIsolated,advance,reviewSimulationEvidence,reviewControlledTeamDecisions,auditControlledTeamEvidence};
}
return {createBridge,KEY};
});
