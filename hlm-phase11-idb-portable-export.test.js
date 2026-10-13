'use strict';
const assert=require('node:assert/strict');
const {FORMAT,capture,restore}=require('./hlm-phase11-indexeddb-backup');
const {encode,decode,exportForDownload}=require('./hlm-phase11-idb-portable-export');
function fakeIDB(initial,{abortWrite=false,failRead=false}={}){
 let value=initial,closed=0;
 const store={get:()=>request(failRead?Error('Read failed'):undefined,value),put:(v)=>request(abortWrite?Error('QuotaExceededError'):undefined,undefined,()=>{value=v}),delete:()=>request(abortWrite?Error('Abort'):undefined,undefined,()=>{value=undefined})};
 function request(error,result,commit){const req={result,error};queueMicrotask(()=>{if(error)req.onerror?.();else{commit?.();req.onsuccess?.();}});return req}
 return {get state(){return value},get closed(){return closed},open(){const req={};queueMicrotask(()=>{req.result={objectStoreNames:{contains:x=>x==='state'},close(){closed++},transaction(name,mode){const tx={objectStore:()=>store};queueMicrotask(()=>{setTimeout(()=>{if(abortWrite&&mode==='readwrite'){tx.error=Error('Write aborted');tx.onabort?.()}else tx.oncomplete?.()},0)});return tx}};req.onsuccess?.()});return req}};
}
(async()=>{
 const snapshot={format:FORMAT,database:'hlm_front_office_v8',store:'state',record:'db',existed:true,state:{schema:7,settings:{controlledTeamId:4},customPlayers:[{id:12,name:'Rookie'}]}};
 const serialized=encode(snapshot);assert.deepEqual(decode(serialized),snapshot);
 for(const invalid of ['broken','{}',JSON.stringify({format:'bad'}),'x'.repeat(25_000_001)])assert.throws(()=>decode(invalid));
 let file;const confirmation=await exportForDownload(snapshot,p=>{file=p;return true});assert.equal(confirmation.confirmed,true);assert.deepEqual(decode(file.contents),snapshot);
 await assert.rejects(exportForDownload(snapshot,()=>false),/not confirmed/);
 const db=fakeIDB(snapshot.state);const before=await capture(db);assert.deepEqual(before.state,snapshot.state);await assert.rejects(restore(db,{...snapshot,state:{schema:7}},false),/authorization/);assert.deepEqual(db.state,snapshot.state);
 await restore(db,snapshot,true);assert.deepEqual(db.state,snapshot.state);assert(db.closed>=2);
 const failing=fakeIDB(snapshot.state,{abortWrite:true});await assert.rejects(restore(failing,{...snapshot,state:{schema:7,settings:{controlledTeamId:7}}},true));assert.deepEqual(failing.state,snapshot.state);
 const failedRead=fakeIDB(snapshot.state,{failRead:true});await assert.rejects(capture(failedRead));assert.deepEqual(failedRead.state,snapshot.state);
 console.log('Portable backup export, explicit confirmation, read/write failure isolation and save preservation passed');
})().catch(e=>{console.error(e);process.exitCode=1});
