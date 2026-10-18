/* Mission 1340: isolated single-game progression; never uses production keys. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMIsolatedSingleGame=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const KEY='hlm-phase11-m1340-isolated-single-game-v1';
function create(engine,storage){
 if(!engine||typeof engine.applyScheduledGame!=='function'||typeof engine.createBrowserFranchiseSaveStore!=='function'||typeof engine.calculateStandings!=='function'||typeof engine.simulateNextDay!=='function')throw Error('Existing Phase 10 game, standings and save engine required');
 const store=engine.createBrowserFranchiseSaveStore(storage,KEY);
 let baseline=storage.getItem(KEY);
 function load(){const state=store.load();baseline=storage.getItem(KEY);return state}
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
 function advance(gameId,seed,approved){
  if(approved!==true)throw Error('Human GM game approval required');
  if(storage.getItem(KEY)!==baseline)throw Error('Isolated save changed; reload first');
  const before=store.load();if(!before)throw Error('No isolated save');
  review(gameId);
  const result=engine.applyScheduledGame(before,gameId,seed);
  const standings=engine.calculateStandings(result.nextState.universe.teams,result.nextState.activity.games);
  if(storage.getItem(KEY)!==baseline)throw Error('Concurrent isolated save change; reload');
  store.save(result.nextState);
  baseline=storage.getItem(KEY);
  return {result:result.result,standings,state:result.nextState};
 }
 function reviewNextDay(){
  const state=store.load();if(!state)throw Error('No isolated save');
  const preview=engine.simulateNextDay(state,1341);
  return Object.freeze({fromDate:preview.fromDate,toDate:preview.toDate,scheduledGameIds:Object.freeze(preview.results.map(g=>g.gameId)),games:preview.results.length});
 }
 function advanceNextDay(seed,approved){
  if(approved!==true)throw Error('Human GM day approval required');
  if(storage.getItem(KEY)!==baseline)throw Error('Isolated save changed; reload first');
  const before=store.load();if(!before)throw Error('No isolated save');
  if(!before.activity.games.some(g=>g.status==='scheduled'))throw Error('No scheduled games remain');
  const result=engine.simulateNextDay(before,seed);
  if(result.toDate===before.meta.currentDate)throw Error('Duplicate day advance refused');
  if(storage.getItem(KEY)!==baseline)throw Error('Concurrent isolated save change; reload');
  store.save(result.nextState);baseline=storage.getItem(KEY);
  return {fromDate:result.fromDate,toDate:result.toDate,results:result.results,standings:result.standings,state:result.nextState};
 }
 return {key:KEY,load,stage,review,advance,reviewNextDay,advanceNextDay};
}
return {KEY,create};
});
