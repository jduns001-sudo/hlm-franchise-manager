'use strict';
const {previewRosterImport,stageRosterImport}=require('./hlm-phase11-roster-import');
const KEY='hlm-phase11-imported-franchise-v1';
function mapExternalRoster(raw){
 if(!raw||typeof raw!=='object'||!Array.isArray(raw.teams)||!Array.isArray(raw.players))throw new Error('Expected teams and players arrays');
 const teams=raw.teams.map(t=>({id:t.id??t.teamId,name:t.name??t.teamName}));
 const names=new Map(teams.map(t=>[String(t.name).toLowerCase(),t.id]));
 const players=raw.players.map(p=>{
  const teamId=p.teamId??p.team_id??names.get(String(p.teamName??'').toLowerCase());
  const position=String(p.position??p.pos??'').toUpperCase();
  const normalizedPosition=position==='LD'||position==='RD'?'D':position==='GK'?'G':position;
  const overall=Number(p.ovr??p.overall);
  return {id:p.id??p.playerId,name:p.name??p.playerName,teamId,position:normalizedPosition,ovr:overall};
 });
 const text=JSON.stringify({format:'hlm-phase11-roster-import-v1',teams,players});
 previewRosterImport(text);
 return text;
}
function createVersionedImportStore(storage){
 if(!storage||typeof storage.getItem!=='function'||typeof storage.setItem!=='function')throw new TypeError('Storage API required');
 function preview(text){return previewRosterImport(text)}
 function load(){const saved=storage.getItem(KEY);return saved===null?null:JSON.parse(saved)}
 function commit(text,{confirm=false,startDate='2026-10-13'}={}){
  if(confirm!==true)throw new Error('Explicit import confirmation required');
  if(storage.getItem(KEY)!==null)throw new Error('Imported franchise already exists; use a new save or export and clear it explicitly');
  const state=stageRosterImport(text,{startDate});
  // Exclusive Phase 11 namespace; never read/write Front Office or Phase 10 keys.
  storage.setItem(KEY,JSON.stringify(state));
  return state;
 }
 return {key:KEY,preview,load,commit};
}
module.exports={mapExternalRoster,createVersionedImportStore};
