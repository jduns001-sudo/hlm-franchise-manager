/* Read-only, opt-in experimental roster preview. Never touches storage or production state. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMRosterPreviewAdapter=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function id(value){if((typeof value!=='string'&&typeof value!=='number')||!String(value).trim()||!(/^[a-zA-Z0-9_-]+$/).test(String(value)))throw Error('Invalid identity');return String(value);}
function preview(source,options){if(!options||options.humanApproved!==true)throw Error('Human GM preview approval required');if(!source||!source.universe||!Array.isArray(source.universe.teams)||!Array.isArray(source.universe.players)||!source.meta)throw Error('Invalid Front Office snapshot');
const teams=new Set(),players=new Set();const safeTeams=source.universe.teams.map(t=>{const key=id(t.id);if(teams.has(key))throw Error('Duplicate team identity');teams.add(key);return {id:key,name:String(t.name||'Team').slice(0,100)}});const safePlayers=source.universe.players.map(p=>{const key=id(p.id),team=id(p.teamId);if(players.has(key))throw Error('Duplicate player identity');if(!teams.has(team))throw Error('Unknown player team');players.add(key);return {id:key,teamId:team}});const controlled=id(source.meta.controlledTeamId);if(!teams.has(controlled))throw Error('Unknown controlled team');
return Object.freeze({universe:Object.freeze({teams:Object.freeze(safeTeams.map(t=>Object.freeze(t))),players:Object.freeze(safePlayers.map(p=>Object.freeze(p)))}),meta:Object.freeze({controlledTeamId:controlled}),productionWrite:false,activationEnabled:false,finalDecisionMaker:'human-gm'});}
return Object.freeze({preview,activationEnabled:false,productionWrite:false});
});
