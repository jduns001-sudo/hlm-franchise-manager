'use strict';
const assert=require('node:assert/strict');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {createFranchiseSaveStore}=require('./hlm-phase10-save-store');
const data=new Map();
const adapter={read:key=>data.get(key)??null,write:(key,value)=>data.set(key,value)};
const store=createFranchiseSaveStore(adapter,'demo');
assert.equal(store.load(),null);
assert.throws(()=>store.advanceAndSave(5),/No saved/);
const original=createGameStateEnvelope({
  meta:{saveId:'demo',currentDate:'2026-10-12',controlledTeamId:1},
  teams:[{id:1,name:'Home'},{id:2,name:'Away'}],
  games:[{id:'G1',date:'2026-10-13',status:'scheduled',homeTeamId:1,awayTeamId:2}]
});
store.save(original);
assert.deepEqual(store.load(),original);
const next=store.advanceAndSave(5);
assert.equal(next.toDate,'2026-10-13');
assert.equal(next.results.length,1);
assert.equal(store.load().activity.games[0].status,'final');
assert.equal(original.meta.currentDate,'2026-10-12');
assert.equal(store.load().meta.currentDate,'2026-10-13');
const failing=createFranchiseSaveStore({read:adapter.read,write:()=>{throw Error('Disk full')}},'demo');
assert.throws(()=>failing.advanceAndSave(5),/Disk full/);
assert.equal(store.load().meta.currentDate,'2026-10-13');
data.set('broken','{not-json');
assert.throws(()=>createFranchiseSaveStore(adapter,'broken').load(),SyntaxError);
assert.throws(()=>createFranchiseSaveStore({}),/adapter/);
console.log('Phase 10 save transaction tests passed');
