/* Read-only legacy Front Office projection. Never writes or activates production. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMFrontOfficeReadOnlyProjection=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const LEGACY_KEY='hlm_tracker_v3';
function clone(x){return JSON.parse(JSON.stringify(x));}
function project(snapshot){
 if(!snapshot||typeof snapshot!=='object'||Array.isArray(snapshot))throw Error('Invalid Front Office snapshot');
 const teams=snapshot.teams,players=snapshot.players;
 if(!Array.isArray(teams)||teams.length<2||!Array.isArray(players))throw Error('Front Office teams and players are required');
 const settings=snapshot.gmSettings||snapshot.settings||{};
 const controlledTeamId=settings.controlledTeamId??snapshot.controlledTeamId??null;
 const team=teams.find(t=>t&&String(t.id)===String(controlledTeamId));
 if(!team)throw Error('Controlled team not found; no automatic team selection');
 const ids=new Set(),teamIds=new Set();
 for(const t of teams){if(!t||t.id==null||teamIds.has(String(t.id)))throw Error('Duplicate or missing team ID');teamIds.add(String(t.id));}
 for(const p of players){if(!p||p.id==null||ids.has(String(p.id)))throw Error('Duplicate or missing player ID');ids.add(String(p.id));}
 const games=Array.isArray(snapshot.games)?snapshot.games:[];
 const gameIds=new Set();
 for(const g of games){
  if(!g||g.id==null||gameIds.has(String(g.id)))throw Error('Duplicate or missing game ID');
  gameIds.add(String(g.id));
  if(!teamIds.has(String(g.homeTeamId))||!teamIds.has(String(g.awayTeamId)))throw Error('Schedule references missing team');
 }
 const meta=snapshot.gameStateMeta||snapshot.meta||{};
 const currentDate=meta.currentDate||snapshot.currentDate||null;
 const saveId=meta.saveId||snapshot.saveId||null;
 const scheduled=games.filter(g=>g.status==='scheduled').sort((a,b)=>String(a.date).localeCompare(String(b.date)));
 return Object.freeze({kind:'front-office-readonly-gameplay-projection',readOnly:true,productionActivationAllowed:false,isolatedSimulationAllowed:false,source:'legacy-front-office',controlledTeamId,controlledTeamName:team.name??null,currentDate,saveId,teamCount:teams.length,playerCount:players.length,players:clone(players),teams:clone(teams),games:clone(games),contracts:clone(Array.isArray(snapshot.contracts)?snapshot.contracts:[]),nextGame:scheduled.length?clone(scheduled[0]):null,diagnostics:games.length?[]:['NO_GAME_SCHEDULE'],persistencePerformed:false});
}
function read(storage){
 if(!storage||typeof storage.getItem!=='function')throw Error('Read-only storage required');
 const raw=storage.getItem(LEGACY_KEY);
 if(raw==null)throw Error('No local Front Office snapshot found');
 if(raw.length>20*1024*1024)throw Error('Front Office snapshot too large');
 return project(JSON.parse(raw));
}
return {LEGACY_KEY,project,read};
});
