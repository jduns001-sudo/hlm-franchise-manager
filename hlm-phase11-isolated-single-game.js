/* Mission 1340: isolated single-game progression; never uses production keys. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMIsolatedSingleGame=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const KEY='hlm-phase11-m1340-isolated-single-game-v1';
function create(engine,storage,boxScores=null){
 if(!engine||typeof engine.applyScheduledGame!=='function'||typeof engine.createBrowserFranchiseSaveStore!=='function'||typeof engine.calculateStandings!=='function')throw Error('Existing Phase 10 game, standings and save engine required');
 const store=engine.createBrowserFranchiseSaveStore(storage,KEY);
 let baseline=storage.getItem(KEY);
 let pendingOffseason=null;
 let pendingProspectSigning=null;
 let pendingDraftSelection=null;
 function peek(){return store.load()}
 function load(){const state=store.load();baseline=storage.getItem(KEY);pendingOffseason=null;pendingProspectSigning=null;pendingDraftSelection=null;return state}
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
 function approveExperimentalRosterAware(enabled,approved){
  if(approved!==true)throw Error('Explicit human GM experimental simulation approval required');
  if(storage.getItem(KEY)!==baseline)throw Error('Isolated save changed; reload first');
  const before=store.load();if(!before)throw Error('No isolated save');
  if(enabled===true){const choice=verifyApprovedGoaliePlan(before);if(!choice)throw Error('Approved goalie selection required');const goalie=before.universe.players.find(p=>String(p.id)===String(choice.playerId)&&String(p.teamId)===String(choice.teamId));const rating=goalie?.overall??goalie?.ovr;if(!Number.isSafeInteger(rating)||rating<1||rating>99)throw Error('Rated goalie required for experimental score opt-in');}
  const next={...before,extensions:{...before.extensions,phase11ExperimentalRosterAwareScores:enabled===true}};
  if(storage.getItem(KEY)!==baseline)throw Error('Concurrent isolated save change; reload');
  store.save(next);baseline=storage.getItem(KEY);
  return enabled===true;
 }
 function experimentalOptions(state){return state.extensions?.phase11ExperimentalRosterAwareScores===true?{experimentalRosterAware:true}:{};}
 function advance(gameId,seed,approved){
  if(approved!==true)throw Error('Human GM game approval required');
  if(storage.getItem(KEY)!==baseline)throw Error('Isolated save changed; reload first');
  const before=store.load();if(!before)throw Error('No isolated save');
  review(gameId);
  verifyApprovedGoaliePlan(before);
  const result=engine.applyScheduledGame(before,gameId,seed,experimentalOptions(before));
  const standings=engine.calculateStandings(result.nextState.universe.teams,result.nextState.activity.games);
  if(storage.getItem(KEY)!==baseline)throw Error('Concurrent isolated save change; reload');
  const next=boxScores?boxScores.append(before,result.nextState,boxScores.build,seed):result.nextState;
  store.save(next);
  baseline=storage.getItem(KEY);
  return {result:result.result,standings,state:next};
 }
 function reviewGameDaySkaters(gameId){
  if(storage.getItem(KEY)!==baseline)throw Error('Isolated save changed; reload first');
  const before=store.load();if(!before)throw Error('No isolated save');
  if(typeof engine.reviewGameDaySkaters!=='function')throw Error('Game-day readiness engine unavailable');
  const result=engine.reviewGameDaySkaters(before,gameId);
  if(!result.ready)throw Error('Game-day skaters need GM review: '+result.issues.join('; '));
  return Object.freeze({gameId:result.gameId,teamId:result.teamId,playerIds:Object.freeze(result.players.map(p=>p.id)),baseline});
 }
 function approveReviewedGameDaySkaters(reviewed,approved){
  if(approved!==true)throw Error('Explicit human GM game-day skater approval required');
  if(!reviewed||storage.getItem(KEY)!==baseline||reviewed.baseline!==baseline)throw Error('Isolated save changed; reload and review again');
  const current=reviewGameDaySkaters(reviewed.gameId);
  if(String(current.teamId)!==String(reviewed.teamId)||JSON.stringify(current.playerIds)!==JSON.stringify(reviewed.playerIds))throw Error('Game-day skater review changed');
  const before=store.load();
  const next={...before,extensions:{...before.extensions,phase11GmGameDaySkaterApproval:{gameId:current.gameId,teamId:current.teamId,playerIds:[...current.playerIds]}}};
  if(storage.getItem(KEY)!==baseline)throw Error('Concurrent isolated save change; reload');
  store.save(next);baseline=storage.getItem(KEY);
  return Object.freeze({gameId:current.gameId,teamId:current.teamId,playerIds:current.playerIds});
 }
 function verifyGameDaySkaters(state,gameId){
  const plan=state.extensions?.phase11GmApprovedSkaters;
  if(!plan)return;
  if(typeof engine.reviewGameDaySkaters!=='function')throw Error('Game-day readiness engine unavailable');
  const readiness=engine.reviewGameDaySkaters(state,gameId);
  if(!readiness.ready)throw Error('GM game-day skaters need review: '+readiness.issues.join('; '));
  const approval=state.extensions?.phase11GmGameDaySkaterApproval;
  if(!approval||String(approval.gameId)!==String(gameId)||String(approval.teamId)!==String(readiness.teamId)||JSON.stringify(approval.playerIds.map(String))!==JSON.stringify(readiness.players.map(p=>String(p.id))))throw Error('Human GM game-day skater approval required');
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
 function approveSkaterParticipation(playerIds,approved){
  if(approved!==true)throw Error('Explicit human GM skater participation approval required');
  if(storage.getItem(KEY)!==baseline)throw Error('Isolated save changed; reload first');
  const before=store.load();if(!before)throw Error('No isolated save');
  const teamId=before.meta?.controlledTeamId;
  if(!Array.isArray(playerIds)||playerIds.length<3||new Set(playerIds.map(String)).size!==playerIds.length)throw Error('Choose at least three distinct skaters');
  const ids=new Set(playerIds.map(String));
  const chosen=before.universe.players.filter(p=>ids.has(String(p.id))&&String(p.teamId)===String(teamId)&&['C','LW','RW','D','F'].includes(String(p.position||'').toUpperCase()));
  if(chosen.length!==ids.size)throw Error('Skater selection must match controlled-team roster');
  for(const p of chosen){
   const rating=p.overall??p.ovr;
   if(!Number.isSafeInteger(rating)||rating<1||rating>99)throw Error('Rated skater required');
   if((before.activity.injuries||[]).some(i=>String(i.playerId)===String(p.id)&&i.status!=='resolved'&&i.status!=='recovered'&&i.active!==false))throw Error('Injured skater cannot be approved');
  }
  const next={...before,extensions:{...before.extensions,phase11GmApprovedSkaters:{teamId,playerIds:chosen.map(p=>p.id)}}};
  if(storage.getItem(KEY)!==baseline)throw Error('Concurrent isolated save change; reload');
  store.save(next);baseline=storage.getItem(KEY);
  return Object.freeze({teamId,playerIds:Object.freeze(chosen.map(p=>p.id))});
 }
 function reviewNextDay(){
  if(typeof engine.simulateNextDay!=='function')throw Error('Existing Phase 10 day simulation required');
  const state=store.load();if(!state)throw Error('No isolated save');
  const preview=engine.simulateNextDay(state,1341);
  const teamId=state.meta.controlledTeamId;
  const players=(state.universe.players||[]).filter(p=>String(p.teamId)===String(teamId));
  const injuries=state.activity.injuries||[];
  const unresolved=injuries.filter(i=>i&&i.active!==false&&i.status!=='resolved'&&i.status!=='recovered'&&players.some(p=>String(p.id)===String(i.playerId)));
  const injuredIds=new Set(unresolved.map(i=>String(i.playerId)));
  const goaliePlan=state.extensions?.phase11GmGoaliePlan;
  const goalie=goaliePlan&&String(goaliePlan.teamId)===String(teamId)?players.find(p=>String(p.id)===String(goaliePlan.playerId)&&String(p.position||'').toUpperCase()==='G'):null;
  const skaterPlan=state.extensions?.phase11GmApprovedSkaters;
  const approvedSkaterIds=skaterPlan&&String(skaterPlan.teamId)===String(teamId)&&Array.isArray(skaterPlan.playerIds)?skaterPlan.playerIds:[];
  const missingSkaters=approvedSkaterIds.filter(id=>!players.some(p=>String(p.id)===String(id)&&String(p.position||'').toUpperCase()!=='G'));
  const injuredSkaters=approvedSkaterIds.filter(id=>injuredIds.has(String(id)));
  const readiness=Object.freeze({rosterPlayers:players.length,unresolvedInjuries:unresolved.length,approvedGoalieId:goalie?.id??null,goalieNeedsReview:!!goaliePlan&&(!goalie||injuredIds.has(String(goalie.id))),approvedSkaters:approvedSkaterIds.length,skatersNeedReview:missingSkaters.length>0||injuredSkaters.length>0,experimentalEnabled:state.extensions?.phase11ExperimentalRosterAwareScores===true});
  const matchups=preview.results.map(result=>{const game=state.activity.games.find(g=>String(g.id)===String(result.gameId));if(!game)throw Error('Reviewed game missing from schedule');const controlledTeamInvolved=String(game.homeTeamId)===String(teamId)||String(game.awayTeamId)===String(teamId);return Object.freeze({gameId:game.id,date:game.date,homeTeamId:game.homeTeamId,awayTeamId:game.awayTeamId,controlledTeamInvolved,readiness:controlledTeamInvolved?readiness:null});});
  return Object.freeze({fromDate:preview.fromDate,toDate:preview.toDate,scheduledGameIds:Object.freeze(matchups.map(g=>g.gameId)),matchups:Object.freeze(matchups),games:matchups.length});
 }
 function advanceNextDay(seed,approved){
  if(typeof engine.simulateNextDay!=='function')throw Error('Existing Phase 10 day simulation required');
  if(approved!==true)throw Error('Human GM day approval required');
  if(storage.getItem(KEY)!==baseline)throw Error('Isolated save changed; reload first');
  const before=store.load();if(!before)throw Error('No isolated save');
  if(!before.activity.games.some(g=>g.status==='scheduled'))throw Error('No scheduled games remain');
  verifyApprovedGoaliePlan(before);
  const result=engine.simulateNextDay(before,seed,experimentalOptions(before));
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
 function reviewDraftSelection(input){
  pendingDraftSelection=null;
  if(storage.getItem(KEY)!==baseline)throw Error('Isolated save changed; reload first');
  const before=store.load();if(!before)throw Error('No isolated save');
  if(String(input?.teamId)!==String(before.meta.controlledTeamId))throw Error('Human GM can draft only for controlled team');
  if(typeof engine.selectDraftProspect!=='function')throw Error('Draft selection engine unavailable');
  const options=JSON.parse(JSON.stringify(input));
  const result=engine.selectDraftProspect(before,options);
  if(storage.getItem(KEY)!==baseline)throw Error('Concurrent isolated save change; reload');
  pendingDraftSelection={baseline,options};
  const prospect=result.nextState.universe.prospects.find(p=>String(p.id)===String(options.prospectId));
  return Object.freeze({pickId:options.pickId,prospectId:options.prospectId,prospectName:String(prospect.name||prospect.id),teamId:options.teamId});
 }
 function approveReviewedDraftSelection(approved){
  if(approved!==true)throw Error('Human GM draft selection approval required');
  if(!pendingDraftSelection)throw Error('Review draft selection before approval');
  if(storage.getItem(KEY)!==baseline||storage.getItem(KEY)!==pendingDraftSelection.baseline){pendingDraftSelection=null;throw Error('Isolated save changed; reload and review again')}
  const options=pendingDraftSelection.options;pendingDraftSelection=null;
  const before=store.load();if(!before)throw Error('No isolated save');
  if(String(options.teamId)!==String(before.meta.controlledTeamId))throw Error('Controlled team changed');
  const result=engine.selectDraftProspect(before,options);
  if(storage.getItem(KEY)!==baseline)throw Error('Concurrent isolated save change; reload');
  store.save(result.nextState);baseline=storage.getItem(KEY);
  return result;
 }
 function reviewProspectSigning(input){
  pendingProspectSigning=null;
  if(storage.getItem(KEY)!==baseline)throw Error('Isolated save changed; reload first');
  const before=store.load();if(!before)throw Error('No isolated save');
  if(String(input?.teamId)!==String(before.meta.controlledTeamId))throw Error('Human GM can sign only controlled-team prospects');
  if(typeof engine.signDraftedProspect!=='function')throw Error('Prospect signing engine unavailable');
  const options=JSON.parse(JSON.stringify(input));
  const result=engine.signDraftedProspect(before,options);
  if(storage.getItem(KEY)!==baseline)throw Error('Concurrent isolated save change; reload');
  pendingProspectSigning={baseline,options};
  return Object.freeze({summary:JSON.parse(JSON.stringify(result.summary)),playerName:result.nextState.universe.players.find(p=>String(p.id)===String(options.prospectId))?.name||String(options.prospectId)});
 }
 function approveReviewedProspectSigning(approved){
  if(approved!==true)throw Error('Human GM prospect signing approval required');
  if(!pendingProspectSigning)throw Error('Review prospect signing before approval');
  if(storage.getItem(KEY)!==baseline||storage.getItem(KEY)!==pendingProspectSigning.baseline){pendingProspectSigning=null;throw Error('Isolated save changed; reload and review again')}
  const options=pendingProspectSigning.options;pendingProspectSigning=null;
  const before=store.load();if(!before)throw Error('No isolated save');
  if(String(options.teamId)!==String(before.meta.controlledTeamId))throw Error('Controlled team changed');
  const result=engine.signDraftedProspect(before,options);
  if(storage.getItem(KEY)!==baseline)throw Error('Concurrent isolated save change; reload');
  store.save(result.nextState);baseline=storage.getItem(KEY);
  return result;
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
 return {key:KEY,load,peek,stage,review,advance,reviewNextDay,advanceNextDay,startPlayoffs,advancePlayoff,archiveSeason,startNextSeason,reviewOffseason,approveReviewedOffseason,reviewProspectSigning,approveReviewedProspectSigning,reviewDraftSelection,approveReviewedDraftSelection,careerSnapshot,reviewGameDaySkaters,approveReviewedGameDaySkaters,reviewGoalieChoice,approveGoalieChoice,approveSkaterParticipation,approveExperimentalRosterAware};
}
return {KEY,create};
});
