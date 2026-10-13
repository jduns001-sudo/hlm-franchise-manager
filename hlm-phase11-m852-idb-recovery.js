'use strict';
// Test-only IndexedDB transaction harness; NEVER use production database names.
const DB='hlm_phase11_m852_test_only';
const STORE='snapshots';
function openDB(indexedDB,name=DB){
 if(!name.startsWith(DB))throw Error('Test database namespace required');
 return new Promise((resolve,reject)=>{
  const req=indexedDB.open(name,1);
  req.onupgradeneeded=()=>req.result.createObjectStore(STORE);
  req.onerror=()=>reject(req.error);
  req.onsuccess=()=>resolve(req.result);
 });
}
function write(db,key,value){
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(STORE,'readwrite');
  tx.objectStore(STORE).put(value,key);
  tx.oncomplete=()=>resolve();
  tx.onerror=()=>reject(tx.error);
  tx.onabort=()=>reject(tx.error||Error('Transaction aborted'));
 });
}
function read(db,key){
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(STORE,'readonly'),req=tx.objectStore(STORE).get(key);
  req.onsuccess=()=>resolve(req.result);
  req.onerror=()=>reject(req.error);
 });
}
async function stagedRecovery(db,original,candidate,failAt){
 await write(db,'original',original);
 if(failAt==='before-stage')throw Error('Injected before-stage failure');
 await write(db,'candidate',candidate);
 if(failAt==='after-stage')throw Error('Injected after-stage interruption');
 await write(db,'journal',{phase:'staged',authorized:false});
 if(failAt==='after-journal')throw Error('Injected after-journal interruption');
 return read(db,'original');
}
module.exports={DB,STORE,openDB,write,read,stagedRecovery};
