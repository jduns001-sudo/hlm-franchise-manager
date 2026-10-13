'use strict';
const assert=require('node:assert/strict');
const {indexedDB}=require('fake-indexeddb');
const {legacyV5,clone}=require('./hlm-phase11-m851-legacy-fixtures');
const {DB,openDB,read,stagedRecovery}=require('./hlm-phase11-m852-idb-recovery');
(async()=>{
 for(const phase of ['before-stage','after-stage','after-journal',null]){
  const name=DB+'_'+(phase||'complete');
  let db=await openDB(indexedDB,name);
  const original=clone(legacyV5),candidate=clone(original);
  candidate.roster[0].overall=99;
  if(phase)await assert.rejects(stagedRecovery(db,original,candidate,phase),/Injected/);
  else await stagedRecovery(db,original,candidate,null);
  db.close(); // Simulate browser reload: close and reopen the isolated database.
  db=await openDB(indexedDB,name);
  assert.deepEqual(await read(db,'original'),original,'Original must survive '+phase);
  if(phase==='before-stage')assert.equal(await read(db,'candidate'),undefined);
  else assert.deepEqual(await read(db,'candidate'),candidate);
  assert.deepEqual(await read(db,'original'),legacyV5);
  assert.equal(await read(db,'production'),undefined);
  db.close();
 }
 await assert.rejects(openDB(indexedDB,'hlm_front_office_v8'),/Test database namespace required/);
 console.log('Mission 852 isolated fake IndexedDB reload/failure fidelity passed; not a real browser crash test');
})().catch(e=>{console.error(e);process.exitCode=1});
