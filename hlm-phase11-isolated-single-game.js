/* Mission 1340: isolated single-game progression; never uses production keys. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMIsolatedSingleGame=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const KEY='hlm-phase11-m1340-isolated-single-game-v1';
function create(engine,storage,boxScores=null){
 if(!engine||typeof engine.applyScheduledGame!=='function'||typeof engine.createBrowserFranchiseSaveStore!=='function'||typeof engine.calculateStandings!=='function')throw Error('Existing Phase 10 game, standings and save engine required');
 const store=engine.createBrowserFranchiseSaveStore(storage,KEY);
 let baseline=storage.getItem(KEY);
 let pendingOffseason=null;
 function load(){const state=store.load();baseline=storage.getItem(KEY);pendingOffseason=null;return state}
 function stage(state,approved){
  if(approved!==true)throw Error('Human GM import approval required');
  if(storage.getItem(KEY)!==baseline)throw Error('Isolated save changed; reload first');
  if(state?.meta?.controlledTeamId==null||!state.universe?.teams?.some(t=>String(t.id)===String(state.meta.controlledTeamId)))throw Error('Controlled team missing');
  if(storage.getItem(KEY)!==null)throw Error('Existing isolated save must not be overwritten');
  store.save(state);return load();
 }
 function review(gameId){
  const state=store.load();if(!state)throw Error('Import an isolated franchise first');
  const matches=state.activity.games.filter(g=>String(g.id)===String(gameId));
  if(matches.length!==1||matches[0].status!=='scheduled')throw Error('Game already played or unavailable');
  const g=matches[0];
  return Object.freeze({id:g.id,date:g.date,homeTeamId:g.homeTeamId,awayTeamId:g.awayTeamId,status:g.status});
 }
 function verifyApprovedGoaliePlan(state){
  const plan=state.extensions?.phase11GmGoaliePlan;
  if(!plan)return null;
  if(String(plan.teamId)!==String(state.meta?.controlledTeamId))throw Error('Approved GM goalie plan team mismatch');
  const choice=reviewGoalieChoice(plan.playerId);
  if(String(choice.teamId)!==String(plan.teamId))throw Error('Approved GM goalie plan no longer valid');
  return choice;
 }
 function advance(gameId,seed,approved){
  if(approved!==true)throw Error('Human GM game approval required');
  if(storage.getItem(KEY)!==baseline)throw Error('Isolated save changed; reload first');
  const before=store.load();if(!before)throw Error('No isolated save');
  review(gameId);
  verifyApprovedGoaliePlan(before);
  const result=engine.applyScheduledGame(before,gameId,seed);
  const standings=engine.calculateStandings(result.nextState.universe.teams,result.nextState.activity.games);
  if(storage.getItem(KEY)!==baseline)throw Error('Concurrent isolated save change; reload');
  const next=boxScores?boxScores.append(before,result.nextState,boxScores.build,seed):result.nextState;
  store.save(next);
  baseline=storage.getItem(KEY);
  return {result:result.result,standings,state:next};
 }
 function reviewGoalieChoice(playerId){
  const state=store.load();if(!state)throw Error('Import an isolated franchise first');
  const teamId=state.meta?.controlledTeamId;
  const candidates=state.universe?.players?.filter(p=>String(p.id)===String(playerId)&&String(p.teamId)===String(teamId)&&String(p.position||'').toUpperCase()==='G')||[];
  if(candidates.length!==1)throw Error('Choose one goalie on your controlled-team roster');
  const goalie=candidates[0];
  const injuries=state.activity?.injuries||[];
  const unresolved=injuries.some(i=>String(i.playerId)===String(goalie.id)&&i.status!=='resolved'&&i.status!=='recovered'&&i.active!==false);
  if(unresolved)throw Error('Goalie has an unresolved injury record; selection blocked pending GM review');
  return Object.freeze({playerId:goalie.id,playerName:String(goalie.name||goalie.id),teamId});
 }
 function approveGoalieChoice(playerId,approved){
  if(approved!==true)throw Error('Human GM approval required for goalie selection');
  if(storage.getItem(KEY)!==baseline)throw Error('Isolated save changed; reload first');
  const choice=reviewGoalieChoice(playerId);
  const state=store.load();
  const next={...state,extensions:{...state.extensions,phase11GmGoaliePlan:{playerId:choice.playerId,teamId:choice.teamId}}};
  if(storage.getItem(KEY)!==baseline)throw Error('Concurrent isolated save change; reload');
  store.save(next);baseline=storage.getItem(KEY);
  return choice;
 }
 function reviewNextDay(){
  if(typeof engine.simulateNextDay!=='function')throw Error('Existing Phase 10 day simulation required');
  const state=store.load();if(!state)throw Error('No isolated save');
  const preview=engine.simulateNextDay(state,1341);
  return Object.freeze({fromDate:preview.fromDate,toDate:preview.toDate,scheduledGameIds:Object.freeze(preview.results.map(g=>g.gameId)),games:preview.results.length});
 }
 function advanceNextDay(seed,approved){
  if(typeof engine.simulateNextDay!=='function')throw Error('Existing Phase 10 day simulation required');
  if(approved!==true)throw Error('Human GM day approval required');
  if(storage.getItem(KEY)!==baseline)throw Error('Isolated save changed; reload first');
  const before=store.load();if(!before)throw Error('No isolated save');
  if(!before.activity.games.some(g=>g.status==='scheduled'))throw Error('No scheduled games remain');
  verifyApprovedGoaliePlan(before);
  const result=engine.simulateNextDay(before,seed);
  if(result.toDate===before.meta.currentDate)throw Error('Duplicate day advance refused');
  if(storage.getItem(KEY)!==baseline)throw Error('Concurrent isolated save change; reload');
  const next=boxScores?boxScores.append(before,result.nextState,boxScores.build,seed):result.nextState;
  store.save(next);baseline=storage.getItem(KEY);
  return {fromDate:result.fromDate,toDate:result.toDate,results:result.results,standings:result.standings,state:next};
 }
 function startPlayoffs(approved,spots=4,bestOf=7){
  if(approved!==true)throw Error('Human GM playoff approval required');
  if(typeof engine.startSeasonPlayoffs!=='function')throw Error('Existing Phase 10 playoff engine required');
  if(storage.getItem(KEY)!==baseline)throw Error('Isolated save changed; reload first');
  const before=store.load();if(!before)throw Error('No isolated save');
  const result=engine.startSeasonPlayoffs(before,spots,bestOf);
  if(storage.getItem(KEY)!==baseline)throw Error('Concurrent isolated save change; reload');
  store.save(result.nextState);baseline=storage.getItem(KEY);
  return result;
 }
 function advancePlayoff(seed,approved){
  if(approved!==true)throw Error('Human GM playoff game approval required');
  if(typeof engine.simulateNextPlayoffGame!=='function')throw Error('Existing Phase 10 playoff simulation required');
  if(storage.getItem(KEY)!==baseline)throw Error('Isolated save changed; reload first');
  const before=store.load();if(!before)throw Error('No isolated save');
  verifyApprovedGoaliePlan(before);
  const result=engine.simulateNextPlayoffGame(before,seed);
  if(storage.getItem(KEY)!==baseline)throw Error('Concurrent isolated save change; reload');
  const next=boxScores?boxScores.append(before,result.nextState,boxScores.build,seed):result.nextState;
  store.save(next);baseline=storage.getItem(KEY);
  return {...result,nextState:next};
 }
 function archiveSeason(seasonId,approved){
  if(approved!==true)throw Error('Human GM season archive approval required');
  if(typeof engine.finalizeChampionshipSeason!=='function')throw Error('Existing Phase 10 championship finalization required');
  if(storage.getItem(KEY)!==baseline)throw Error('Isolated save changed; reload first');
  const before=store.load();if(!before)throw Error('No isolated save');
  const result=engine.finalizeChampionshipSeason(before,seasonId);
  if(storage.getItem(KEY)!==baseline)throw Error('Concurrent isolated save change; reload');
  store.save(result.nextState);baseline=storage.getItem(KEY);
  return result;
 }
 function careerSnapshot(){
  const state=store.load();if(!state)throw Error('No isolated save');
  const contracts=state.assets.contracts;
  const active=contracts.filter(c=>c&&c.status==='active');
  const picks=state.assets.draftPicks;
  const seasons=state.history.seasons;
  return Object.freeze({
   controlledTeamId:state.meta.controlledTeamId,
   seasonId:state.extensions.phase10CurrentSeasonId||null,
   completedSeasons:seasons.map(s=>({seasonId:s.seasonId,championTeamId:s.championTeamId})),
   playerCount:state.universe.players.length,teamCount:state.universe.teams.length,
   prospectCount:state.universe.prospects.length,contractCount:contracts.length,
   activeContractCount:active.length,draftPickCount:picks.length,
   usedDraftPickCount:picks.filter(p=>p.status==='used').length,
   scheduledGames:state.activity.games.filter(g=>g.status==='scheduled').length,
   finances:JSON.parse(JSON.stringify(state.finances))
  });
 }
 function reviewOffseason(options){
  pendingOffseason=null;
  if(storage.getItem(KEY)!==baseline)throw Error('Isolated save changed; reload first');
  const before=store.load();if(!before)throw Error('No isolated save');
  if(typeof engine.completeOffseasonAndStartSeason!=='function')throw Error('Existing Phase 10 offseason workflow required');
  const proposed=JSON.parse(JSON.stringify(options));
  const result=engine.completeOffseasonAndStartSeason(before,proposed);
  if(storage.getItem(KEY)!==baseline)throw Error('Concurrent isolated save change; reload');
  pendingOffseason={baseline,options:proposed};
  return Object.freeze({summary:JSON.parse(JSON.stringify(result.summary)),controlledTeamId:before.meta.controlledTeamId,archivedSeasons:before.history.seasons.length,proposedGames:result.nextState.activity.games.length});
 }
 function approveReviewedOffseason(approved){
  if(approved!==true)throw Error('Human GM offseason approval required');
  if(!pendingOffseason)throw Error('Review offseason before approval');
  if(storage.getItem(KEY)!==pendingOffseason.baseline||storage.getItem(KEY)!==baseline){pendingOffseason=null;throw Error('Isolated save changed; reload and review again')}
  const options=pendingOffseason.options;pendingOffseason=null;
  return startNextSeason(options,true);
 }
 function startNextSeason(options,approved){
  if(approved!==true)throw Error('Human GM offseason approval required');
  if(typeof engine.completeOffseasonAndStartSeason!=='function')throw Error('Existing Phase 10 offseason workflow required');
  if(storage.getItem(KEY)!==baseline)throw Error('Isolated save changed; reload first');
  const before=store.load();if(!before)throw Error('No isolated save');
  const result=engine.completeOffseasonAndStartSeason(before,options);
  if(storage.getItem(KEY)!==baseline)throw Error('Concurrent isolated save change; reload');
  store.save(result.nextState);baseline=storage.getItem(KEY);
  return result;
 }
 return {key:KEY,load,stage,review,advance,reviewNextDay,advanceNextDay,startPlayoffs,advancePlayoff,archiveSeason,startNextSeason,reviewOffseason,approveReviewedOffseason,careerSnapshot,reviewGoalieChoice,approveGoalieChoice};
}
return {KEY,create};
});
