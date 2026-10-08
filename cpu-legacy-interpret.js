(function(root){
'use strict';
// 431: parse legacy snapshot; 432: controlled team lookup;
// 433: roster count; 434: dataset inventory; 435: safe read-only diagnostics.
function interpretLegacy(storage){
 if(!storage||typeof storage.getItem!=='function')throw new TypeError('Storage reader required');
 const raw=storage.getItem('hlm_tracker_v3');
 if(raw==null)return Object.freeze({kind:'cpu-legacy-interpretation',found:false,teamId:null,players:0,datasets:Object.freeze([]),warnings:Object.freeze(['No local Front Office snapshot']),readOnly:true});
 if(raw.length>5000000)throw new Error('Snapshot exceeds 5 MB');
 let data;try{data=JSON.parse(raw);}catch(_){throw new Error('Invalid legacy snapshot JSON');}
 if(!data||typeof data!=='object'||Array.isArray(data))throw new Error('Legacy snapshot must be an object');
 const teamId=data.gmSettings&&data.gmSettings.controlledTeamId!=null?data.gmSettings.controlledTeamId:(data.controlledTeamId??null);
 const players=Array.isArray(data.players)?data.players.length:0;
 const datasets=Object.keys(data).filter(k=>Array.isArray(data[k])).sort();
 const warnings=[];if(teamId==null)warnings.push('Controlled team not identified');if(!Array.isArray(data.players))warnings.push('Top-level players array not found');
 return Object.freeze({kind:'cpu-legacy-interpretation',found:true,teamId,players,datasets:Object.freeze(datasets),warnings:Object.freeze(warnings),readOnly:true,gameStateValidated:false,decisionsGenerated:false});
}
if(typeof module!=='undefined'&&module.exports)module.exports={interpretLegacy};
root.HFMCPULegacyInterpret=Object.freeze({interpretLegacy});
})(typeof globalThis!=='undefined'?globalThis:this);
