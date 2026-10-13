'use strict';
const assert=require('node:assert/strict');
const {capture,restore,validateSnapshot,DB_NAME}=require('./hlm-phase11-indexeddb-backup');
const store=new Map([['db',{schema:7,settings:{controlledTeamId:1},customPlayers:[{id:2}]}]]);
function fakeIDB(){
 return {open(name){assert.equal(name,DB_NAME);const req={};queueMicrotask(()=>{req.result={objectStoreNames:{contains:s=>s==='state'},close(){},transaction(_s,mode){const tx={};tx.objectStore=()=>({get:k=>request(()=>store.get(k),tx),put:(v,k)=>request(()=>{store.set(k,v);return k},tx),delete:k=>request(()=>{store.delete(k)},tx)});return tx}};req.onsuccess()});return req}}
}
function request(fn,tx){const req={};queueMicrotask(()=>{try{req.result=fn();req.onsuccess?.();queueMicrotask(()=>tx.oncomplete?.())}catch(e){req.error=e;req.onerror?.();tx.onerror?.()}});return req}
(async()=>{
 const idb=fakeIDB(),before=await capture(idb);
 assert.equal(before.existed,true);assert.equal(before.state.settings.controlledTeamId,1);
 assert.throws(()=>validateSnapshot({...before,database:'other'}),/Invalid/);
 await assert.rejects(restore(idb,before,false),/authorization/);
 assert.deepEqual(store.get('db'),before.state);
 store.set('db',{schema:7,settings:{controlledTeamId:999}});
 const result=await restore(idb,before,true);assert.equal(result.restored,true);assert.deepEqual(store.get('db'),before.state);
 store.delete('db');const empty=await capture(idb);assert.equal(empty.existed,false);assert.equal(empty.state,null);
 store.set('db',{schema:7});await restore(idb,empty,true);assert.equal(store.has('db'),false);
 await assert.rejects(capture(null),/IndexedDB required/);
 console.log('Phase 11 isolated IndexedDB capture and exact rollback tests passed');
})().catch(e=>{console.error(e);process.exitCode=1});
