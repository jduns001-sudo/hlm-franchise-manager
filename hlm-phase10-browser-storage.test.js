'use strict';
const assert=require('node:assert/strict');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {createBrowserStorageAdapter,createBrowserFranchiseSaveStore}=require('./hlm-phase10-browser-storage');
const map=new Map();
const storage={getItem:key=>map.get(key)??null,setItem:(key,value)=>map.set(key,value)};
assert.throws(()=>createBrowserStorageAdapter(null),/Storage/);
const store=createBrowserFranchiseSaveStore(storage,'save');
const state=createGameStateEnvelope({
  meta:{saveId:'browser',currentDate:'2026-10-12',controlledTeamId:1},
  teams:[{id:1,name:'Home'},{id:2,name:'Away'}],
  games:[{id:'G1',date:'2026-10-13',status:'scheduled',homeTeamId:1,awayTeamId:2}]
});
store.save(state);
assert.deepEqual(store.load(),state);
const advance=store.advanceAndSave(8);
assert.equal(advance.results.length,1);
assert.equal(createBrowserFranchiseSaveStore(storage,'save').load().meta.currentDate,'2026-10-13');
const blocked=createBrowserFranchiseSaveStore({getItem:storage.getItem,setItem:()=>{throw Error('QuotaExceeded')}},'save');
assert.throws(()=>blocked.save(state),/QuotaExceeded/);
assert.equal(store.load().meta.currentDate,'2026-10-13');
console.log('Phase 10 browser storage adapter tests passed');
