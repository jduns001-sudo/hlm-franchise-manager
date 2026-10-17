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
 return {key:KEY,summary,load,importIsolated,advance};
}
return {createBridge,KEY};
});
