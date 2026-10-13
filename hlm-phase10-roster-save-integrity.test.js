'use strict';
const assert=require('node:assert/strict');
const {createRosterLabFranchise}=require('./hlm-phase10-roster-lab-entry');
const {createRosterLabSeasonStore}=require('./hlm-phase10-roster-lab-season-store');
function adapter(){const m=new Map([['hlm-phase10-demo-v1','PRESERVE']]);return {m,getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v)}}
const storage=adapter(),store=createRosterLabSeasonStore(storage);
store.save(createRosterLabFranchise());
store.advanceAndSave(20261014);
const before=storage.m.get(store.key),backup=store.exportBackup();
assert.equal(JSON.parse(backup).format,'hlm-phase10-roster-lab-backup-v1');
assert.throws(()=>store.importBackup(backup),/explicit replace/);
assert.equal(storage.m.get(store.key),before);
for(const invalid of ['{oops','{}',JSON.stringify({format:'hlm-phase10-roster-lab-backup-v1',state:{}}),'x'.repeat(10000001)]){
 assert.throws(()=>store.importBackup(invalid,{replace:true}));
 assert.equal(storage.m.get(store.key),before);
}
const wrongSave=JSON.parse(backup);
wrongSave.state.meta.saveId='official-other-franchise';
assert.throws(()=>store.importBackup(JSON.stringify(wrongSave),{replace:true}),/different franchise save/);
assert.equal(storage.m.get(store.key),before);
const fresh=createRosterLabSeasonStore(adapter());
fresh.importBackup(backup);
assert.deepEqual(fresh.load(),store.load());
assert.equal(storage.m.get('hlm-phase10-demo-v1'),'PRESERVE');
store.importBackup(backup,{replace:true});
assert.equal(storage.m.get(store.key),before);

// A failed storage write must not destroy the previously saved franchise.
const failedAdapter=adapter();
const healthy=createRosterLabSeasonStore(failedAdapter);
healthy.save(createRosterLabFranchise());
const snapshot=failedAdapter.m.get(healthy.key);
const refusing={getItem:k=>failedAdapter.getItem(k),setItem:()=>{throw new Error('storage quota exceeded')}};
const broken=createRosterLabSeasonStore(refusing);
assert.throws(()=>broken.importBackup(backup,{replace:true}),/storage quota exceeded/);
assert.equal(failedAdapter.m.get(healthy.key),snapshot);
assert.deepEqual(healthy.load(),JSON.parse(snapshot));

console.log('Mission 754 isolated roster backup integrity tests passed.');
