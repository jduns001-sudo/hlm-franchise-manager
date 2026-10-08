(function(root){
'use strict';
// 411: GameState file parsing; 412: HFM_SAVE integrity validation;
// 413: controlled team resolution; 414: read-only franchise snapshot;
// 415: deterministic advisory overview without writing browser storage.
function hashText(text){let h=0x811c9dc5;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,0x01000193);}return(h>>>0).toString(16).padStart(8,'0');}
function parseFranchise(text){
 const input=JSON.parse(text);
 let state=input;
 if(input&&input.format==='HFM_SAVE'){
  if(input.formatVersion!==1||!input.integrity||input.integrity.algorithm!=='fnv1a32'||typeof input.payload!=='string'||hashText(input.payload)!==input.integrity.payloadHash)throw new Error('Save integrity validation failed');
  state=JSON.parse(input.payload);
 }
 if(!state||state.schemaVersion!==1||!state.universe||!Array.isArray(state.universe.teams)||!Array.isArray(state.universe.players)||!state.assets||!Array.isArray(state.assets.contracts)||!Array.isArray(state.assets.draftPicks)||!state.meta)throw new Error('Expected a valid GameState v1 or HFM_SAVE');
 const id=state.meta.controlledTeamId;
 const team=state.universe.teams.find(t=>String(t.id)===String(id))||null;
 return Object.freeze({kind:'cpu-franchise-preview',version:1,teamId:id??null,
  teamName:team?String(team.name??team.id):null,
  counts:Object.freeze({teams:state.universe.teams.length,players:state.universe.players.length,contracts:state.assets.contracts.length,draftPicks:state.assets.draftPicks.length}),
  advisoryOnly:true,executionEnabled:false,persistencePerformed:false});
}
if(typeof module!=='undefined'&&module.exports)module.exports={hashText,parseFranchise};
root.HFMCPUFranchiseImport=Object.freeze({parseFranchise});
})(typeof globalThis!=='undefined'?globalThis:this);
