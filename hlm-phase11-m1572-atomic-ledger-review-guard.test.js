'use strict';
const assert=require('node:assert/strict');
globalThis.indexedDB=require('fake-indexeddb').indexedDB;
const source=require('./hlm-phase11-m1571-multitrade.fixture');
const store=require('./hlm-phase11-m1516-atomic-isolated-state-persistence');
const {createHost}=require('./hlm-phase11-m1566-persisted-trade-review-host');
async function writeLedger(name,value){const db=await store.open(name);try{await new Promise((resolve,reject)=>{
 const tx=db.transaction('records','readwrite'),records=tx.objectStore('records');
 if(value===null)records.delete('ledger');else records.put(value,'ledger');
 tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);
})}finally{db.close()}}
(async()=>{
 let serial=0;
 for(const mutate of [l=>({...l,revision:999}),l=>({...l,events:[...l.events,{id:'concurrent',experimental:true}]}),l=>({...l,events:[]}),()=>null]){
  const name='hlm-phase11-m1572-experimental-'+serial++;
  const options={experimentalEnabled:true,syntheticTestAuthorization:true,experimentalDatabaseName:name};
  const original=source();await store.commit({...options,gmApproved:true,expectedRevision:0,candidateState:original,eventId:'seed'},name);
  const host=createHost(options),request={outgoingPlayerId:'pA',incomingPlayerId:'pB'};
  assert.equal((await host.review(request)).ok,true);
  const initial=await store.read(name);await writeLedger(name,mutate(initial.ledger));
  const concurrent=await store.read(name),result=await host.settle({...request,gmApproved:true,expectedGameRevision:1});
  assert.equal(result.saved,false,result.code);assert.equal(result.code,'stale-experimental-ledger');
  assert.deepEqual(await store.read(name),concurrent,'settlement must not repair, overwrite or append to a changed ledger');
  assert.deepEqual(concurrent.game,original);
 }
 // Change the ledger after settlement's preflight read, just before the atomic
 // commit starts. The check inside the readwrite transaction must still reject.
 const name='hlm-phase11-m1572-experimental-commit-race',options={experimentalEnabled:true,syntheticTestAuthorization:true,experimentalDatabaseName:name};
 await store.commit({...options,gmApproved:true,expectedRevision:0,candidateState:source(),eventId:'seed'},name);
 const host=createHost(options),request={outgoingPlayerId:'pA',incomingPlayerId:'pB'};
 assert.equal((await host.review(request)).ok,true);
 const before=await store.read(name),changed={...before.ledger,events:[...before.ledger.events,{id:'racing-writer',experimental:true}]};
 const commit=store.commit;
 store.commit=async(input,database)=>{await writeLedger(database,changed);return commit(input,database)};
 let result;try{result=await host.settle({...request,gmApproved:true,expectedGameRevision:1})}finally{store.commit=commit}
 assert.equal(result.saved,false);assert.equal(result.code,'stale-or-replayed');
 assert.deepEqual(await store.read(name),{game:before.game,ledger:changed},'atomic compare preserves concurrent ledger and all ownership/history');
 // The persistence boundary itself also rejects revision mismatch and orphans.
 for(const ledger of [{revision:99,events:[]},null]){
  await writeLedger(name,ledger);const snapshot=await store.read(name),candidate=source();candidate.meta.revision=2;
  assert.equal((await commit({...options,gmApproved:true,expectedRevision:1,candidateState:candidate,eventId:'direct'},name)).saved,false);
  assert.deepEqual(await store.read(name),snapshot);
 }
 console.log('M1572 ledger review guard: revision mismatch, changed events, missing ledger, atomic interleaving and direct persistence rejection passed');
})().catch(e=>{console.error(e);process.exitCode=1});
