'use strict';
/* Isolated, dependency-injected IndexedDB backup/rollback adapter. No app.html integration. */
const DB_NAME='hlm_front_office_v8',STORE='state',RECORD='db',FORMAT='hlm-phase11-idb-backup-v1';
function clone(v){return v===undefined?undefined:JSON.parse(JSON.stringify(v))}
function validateSnapshot(snapshot){
 if(!snapshot||snapshot.format!==FORMAT||snapshot.database!==DB_NAME||snapshot.store!==STORE||snapshot.record!==RECORD||typeof snapshot.existed!=='boolean')throw Error('Invalid IndexedDB backup envelope');
 if(snapshot.existed&&(!snapshot.state||typeof snapshot.state!=='object'||Array.isArray(snapshot.state)))throw Error('Invalid backed-up franchise state');
 if(!snapshot.existed&&snapshot.state!==null)throw Error('Absent state must have null payload');
 return snapshot;
}
function transaction(db,mode,work){return new Promise((resolve,reject)=>{
 let tx;try{tx=db.transaction(STORE,mode);const req=work(tx.objectStore(STORE));let result;req.onsuccess=()=>{result=req.result};req.onerror=()=>reject(req.error||Error('IndexedDB request failed'));tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(tx.error||Error('IndexedDB transaction failed'));tx.onabort=()=>reject(tx.error||Error('IndexedDB transaction aborted'))}catch(e){reject(e)}
})}
function connect(indexedDB){return new Promise((resolve,reject)=>{if(!indexedDB||typeof indexedDB.open!=='function')return reject(Error('IndexedDB required'));const request=indexedDB.open(DB_NAME);request.onupgradeneeded=()=>{request.transaction.abort()};request.onsuccess=()=>{const db=request.result;if(!db.objectStoreNames.contains(STORE)){db.close();reject(Error('Production store missing'))}else resolve(db)};request.onerror=()=>reject(request.error||Error('IndexedDB open failed'));request.onblocked=()=>reject(Error('IndexedDB blocked'))})}
async function capture(indexedDB){const db=await connect(indexedDB);try{const state=await transaction(db,'readonly',s=>s.get(RECORD));const snapshot={format:FORMAT,database:DB_NAME,store:STORE,record:RECORD,existed:state!==undefined,state:state===undefined?null:clone(state)};validateSnapshot(snapshot);return snapshot}finally{db.close()}}
async function restore(indexedDB,snapshot,authorization){validateSnapshot(snapshot);if(authorization!==true)throw Error('Explicit GM authorization required');const db=await connect(indexedDB);try{await transaction(db,'readwrite',s=>snapshot.existed?s.put(clone(snapshot.state),RECORD):s.delete(RECORD));const result=await transaction(db,'readonly',s=>s.get(RECORD));if(JSON.stringify(result===undefined?null:result)!==JSON.stringify(snapshot.state))throw Error('Rollback verification failed');return {restored:true,existed:snapshot.existed}}finally{db.close()}}
module.exports={DB_NAME,STORE,RECORD,FORMAT,validateSnapshot,capture,restore};
