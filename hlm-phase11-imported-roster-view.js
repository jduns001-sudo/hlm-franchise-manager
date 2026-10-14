'use strict';
const KEY='hlm-phase11-imported-franchise-v1';
function inspectImportedRoster(storage){
 if(!storage||typeof storage.getItem!=='function')throw new TypeError('Storage unavailable');
 const raw=storage.getItem(KEY);
 if(raw===null)return {available:false,teams:[],players:[]};
 if(raw.length>5000000)throw new Error('Imported save exceeds inspection limit');
 let state;try{state=JSON.parse(raw)}catch{throw new Error('Imported save is invalid JSON')}
 const universe=state&&state.universe;
 if(!universe||!Array.isArray(universe.teams)||!Array.isArray(universe.players))throw new Error('Imported save has no valid universe');
 const ids=new Set(),teams=universe.teams.map(t=>{
  if(!t||!Number.isSafeInteger(t.id)||ids.has(t.id)||typeof t.name!=='string')throw new Error('Invalid imported team');
  ids.add(t.id);return {id:t.id,name:t.name};
 });
 const playerIds=new Set(),players=universe.players.map(p=>{
  if(!p||!Number.isSafeInteger(p.id)||playerIds.has(p.id)||!ids.has(p.teamId)||typeof p.name!=='string'||!['C','LW','RW','D','G'].includes(p.position)||!Number.isInteger(p.ovr)||p.ovr<1||p.ovr>99)throw new Error('Invalid imported player');
  playerIds.add(p.id);return {id:p.id,teamId:p.teamId,name:p.name,position:p.position,ovr:p.ovr};
 });
 return {available:true,teams,players};
}
if(typeof module!=='undefined'&&module.exports)module.exports={inspectImportedRoster,KEY};
if(typeof window!=='undefined')window.HLMPhase11ImportedRoster={inspectImportedRoster};
