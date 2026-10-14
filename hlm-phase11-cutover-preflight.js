'use strict';
const DB='hlm_front_office_v8',STORE='state',KEY='db',IMPORT='hlm-phase11-imported-franchise-v1';
function jsonClone(value){
 if(value===undefined)throw new Error('Undefined save cannot be exported');
 const text=JSON.stringify(value);
 if(typeof text!=='string'||text.length>5_000_000)throw new Error('Unsupported or oversized JSON save');
 const copy=JSON.parse(text);
 if(JSON.stringify(copy)!==text)throw new Error('Save round-trip mismatch');
 return {text,copy};
}
function inspectCandidate(storage){
 const raw=storage.getItem(IMPORT);
 if(raw===null)throw new Error('No imported franchise');
 if(raw.length>5_000_000)throw new Error('Import exceeds 5MB');
 let state;try{state=JSON.parse(raw)}catch{throw new Error('Invalid imported franchise JSON')}
 const u=state&&state.universe;
 if(!u||!Array.isArray(u.teams)||!Array.isArray(u.players)||u.teams.length<2)throw new Error('Invalid imported universe');
 const teams=new Set(),players=new Set();
 for(const t of u.teams){if(!t||!Number.isSafeInteger(t.id)||t.id<=0||teams.has(t.id)||typeof t.name!=='string'||!t.name.trim())throw new Error('Invalid team reference');teams.add(t.id)}
 for(const p of u.players){if(!p||!Number.isSafeInteger(p.id)||p.id<=0||players.has(p.id)||!teams.has(p.teamId)||!['C','LW','RW','D','G'].includes(p.position)||!Number.isInteger(p.ovr)||p.ovr<1||p.ovr>99)throw new Error('Invalid player reference');players.add(p.id)}
 if(!state.meta||!teams.has(state.meta.controlledTeamId))throw new Error('Controlled team missing');
 return Object.freeze({teamCount:teams.size,playerCount:players.size,controlledTeamId:state.meta.controlledTeamId,bytes:raw.length});
}
function snapshotRawRecord({present,value}){
 if(typeof present!=='boolean')throw new Error('Explicit record presence required');
 const data=present?jsonClone(value):null;
 return {format:'hlm-phase11-production-backup-preflight-v1',source:{database:DB,store:STORE,key:KEY},present,payload:data?data.text:null};
}
function verifySnapshot(snapshot){
 if(!snapshot||snapshot.format!=='hlm-phase11-production-backup-preflight-v1'||snapshot.source?.database!==DB||snapshot.source?.store!==STORE||snapshot.source?.key!==KEY||typeof snapshot.present!=='boolean')throw new Error('Invalid backup provenance');
 if(!snapshot.present){if(snapshot.payload!==null)throw new Error('Invalid absent-record snapshot');return {present:false}}
 if(typeof snapshot.payload!=='string')throw new Error('Missing save payload');
 const value=JSON.parse(snapshot.payload);
 if(jsonClone(value).text!==snapshot.payload)throw new Error('Backup is not canonical JSON');
 return {present:true,value};
}
function prepareReadOnlyCutover(storage,record){
 const candidate=inspectCandidate(storage),backup=snapshotRawRecord(record);
 verifySnapshot(JSON.parse(JSON.stringify(backup)));
 return {candidate,backup,authorized:false,productionWrites:0,readyForCutover:false};
}
module.exports={inspectCandidate,snapshotRawRecord,verifySnapshot,prepareReadOnlyCutover};
