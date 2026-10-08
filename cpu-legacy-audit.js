(function(root){
'use strict';
// Phase 9 missions 436-450: safe, deterministic legacy franchise audit.
const MAX_BYTES=5000000;
const isRecord=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const id=x=>x==null?null:String(x);
function auditLegacy(storage){
 if(!storage||typeof storage.getItem!=='function')throw new TypeError('Storage reader required');
 const raw=storage.getItem('hlm_tracker_v3');
 if(raw==null)return Object.freeze({found:false,readOnly:true,warnings:Object.freeze(['No local snapshot']),counts:Object.freeze({})});
 if(raw.length>MAX_BYTES)throw new Error('Snapshot exceeds 5 MB');
 let data;try{data=JSON.parse(raw);}catch(_){throw new Error('Invalid snapshot JSON');}
 if(!isRecord(data))throw new TypeError('Snapshot must be an object');
 const names=['teams','players','contracts','draftPicks','transactions','prospects'];
 const counts={};const warnings=[];
 for(const name of names){counts[name]=Array.isArray(data[name])?data[name].length:0;if(data[name]!=null&&!Array.isArray(data[name]))warnings.push(name+' is not an array');}
 const teams=Array.isArray(data.teams)?data.teams:[];
 const players=Array.isArray(data.players)?data.players:[];
 const teamIds=new Set(teams.filter(isRecord).map(t=>id(t.id??t.teamId)).filter(Boolean));
 const playerIds=new Set();let duplicatePlayers=0,unknownTeams=0,invalidPlayers=0;
 for(const player of players){if(!isRecord(player)){invalidPlayers++;continue;}const pid=id(player.id??player.playerId);if(pid!==null){if(playerIds.has(pid))duplicatePlayers++;playerIds.add(pid);}const tid=id(player.teamId);if(tid!==null&&teamIds.size&&!teamIds.has(tid))unknownTeams++;}
 const controlledTeamId=id(data.gmSettings?.controlledTeamId??data.controlledTeamId);
 if(controlledTeamId===null)warnings.push('Controlled team not identified');
 else if(teamIds.size&&!teamIds.has(controlledTeamId))warnings.push('Controlled team not found in teams');
 if(duplicatePlayers)warnings.push('Duplicate player IDs: '+duplicatePlayers);
 if(unknownTeams)warnings.push('Players referencing unknown teams: '+unknownTeams);
 if(invalidPlayers)warnings.push('Invalid player records: '+invalidPlayers);
 const result={kind:'cpu-legacy-audit',found:true,readOnly:true,controlledTeamId,counts:Object.freeze(counts),duplicatePlayers,unknownTeams,invalidPlayers,warnings:Object.freeze(warnings)};
 return Object.freeze(result);
}
if(typeof module!=='undefined'&&module.exports)module.exports={auditLegacy};
root.HFMCPULegacyAudit=Object.freeze({auditLegacy});
})(typeof globalThis!=='undefined'?globalThis:this);
