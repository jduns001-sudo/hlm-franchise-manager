'use strict';
const {IMPORT_KEY}=require('./hlm-phase11-franchise-selection');
function createReadOnlyProjection(storage){
 if(!storage||typeof storage.getItem!=='function')throw TypeError('Storage reader required');
 const raw=storage.getItem(IMPORT_KEY);
 if(raw===null)return {available:false,teams:[],players:[],teamCount:0,playerCount:0};
 let state;try{state=JSON.parse(raw)}catch(e){throw Error('Invalid imported franchise JSON')}
 const u=state&&state.universe;
 if(!u||!Array.isArray(u.teams)||!Array.isArray(u.players))throw Error('Invalid imported franchise structure');
 const teams=u.teams.map(t=>Object.freeze({id:t.id,name:t.name}));
 const players=u.players.map(p=>Object.freeze({id:p.id,name:p.name,teamId:p.teamId,position:p.position,overall:p.ovr}));
 return Object.freeze({available:true,teams:Object.freeze(teams),players:Object.freeze(players),teamCount:teams.length,playerCount:players.length});
}
module.exports={createReadOnlyProjection};
