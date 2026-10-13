'use strict';
const IMPORT_KEY='hlm-phase11-imported-franchise-v1';
const SELECT_KEY='hlm-phase11-selected-source-v1';
function inspect(storage){
 const raw=storage.getItem(IMPORT_KEY);
 if(raw===null)return {available:false,selected:false,teams:0,players:0};
 let state;
 try{state=JSON.parse(raw)}catch(e){throw Error('Imported franchise save is invalid');}
 if(!state||!state.universe||!Array.isArray(state.universe.teams)||!Array.isArray(state.universe.players))throw Error('Imported franchise save has invalid structure');
 return {available:true,selected:storage.getItem(SELECT_KEY)==='imported',teams:state.universe.teams.length,players:state.universe.players.length};
}
function select(storage,source,{confirm=false}={}){
 if(!['existing','imported'].includes(source))throw Error('Unknown source');
 if(confirm!==true)throw Error('Explicit source selection confirmation required');
 if(source==='imported'&&!inspect(storage).available)throw Error('No imported franchise available');
 // This preference is advisory only. No existing Front Office storage key is modified.
 storage.setItem(SELECT_KEY,source);
 return source;
}
module.exports={IMPORT_KEY,SELECT_KEY,inspect,select};
