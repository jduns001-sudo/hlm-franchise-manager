'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {FORMAT}=require('./hlm-phase11-indexeddb-backup');
const {packageSnapshot,verifyReopenedFile,exportAndVerify}=require('./hlm-phase11-durable-file-verify');
(async()=>{
 const state={schema:7,settings:{controlledTeamId:4},customPlayers:[{id:12,name:'Rookie'}],contracts:[{playerId:12,amount:900000}],draftPickOverrides:{},history:[{season:2026}]};
 const snapshot={format:FORMAT,database:'hlm_front_office_v8',store:'state',record:'db',existed:true,state};
 const folder=fs.mkdtempSync(path.join(os.tmpdir(),'hlm-phase11-backup-'));
 try{
  const target=path.join(folder,'franchise-backup.json');
  const write=async({contents})=>{await fs.promises.writeFile(target,contents,{flag:'wx'});return true};
  const reopen=async()=>fs.promises.readFile(target,'utf8');
  const result=await exportAndVerify(snapshot,write,reopen);
  assert.equal(result.verified,true);
  assert.deepEqual(verifyReopenedFile(await reopen(),snapshot),snapshot);
  assert.equal(result.existed,true);
  const raw=await reopen();
  assert.throws(()=>verifyReopenedFile(raw,{...snapshot,state:{schema:7}}),/mismatch/);
  const tampered=JSON.parse(raw);tampered.payload=tampered.payload.replace('Rookie','Tampered');
  assert.throws(()=>verifyReopenedFile(JSON.stringify(tampered),snapshot),/integrity/);
  const wrongFormat=JSON.parse(raw);wrongFormat.format='future-incompatible';
  assert.throws(()=>verifyReopenedFile(JSON.stringify(wrongFormat),snapshot),/Unsupported/);
  const wrongAlgorithm=JSON.parse(raw);wrongAlgorithm.algorithm='md5';
  assert.throws(()=>verifyReopenedFile(JSON.stringify(wrongAlgorithm),snapshot),/Unsupported/);
  assert.throws(()=>verifyReopenedFile('corrupt'),/JSON/);
  assert.throws(()=>verifyReopenedFile('x'.repeat(25_000_001)),/oversized/);
  await assert.rejects(exportAndVerify(snapshot,()=>true,()=>''),/JSON/);
  await assert.rejects(exportAndVerify(snapshot,()=>false,()=>raw),/not confirmed/);
  const empty={...snapshot,existed:false,state:null};
  assert.deepEqual(verifyReopenedFile(packageSnapshot(empty),empty),empty);
  console.log('Phase 11 independent disk file reopen, SHA-256, state equality and corruption rejection passed');
 }finally{fs.rmSync(folder,{recursive:true,force:true})}
})().catch(e=>{console.error(e);process.exitCode=1});
