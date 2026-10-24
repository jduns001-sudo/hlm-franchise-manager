'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {attempt}=require('./hlm-phase11-m1507z-atomic-ledger-adapter');
const ledger=()=>({schema:'hlm-m1507y-replay-ledger-v1',revision:0,consumed:{}});
const receipt={receivingTeamId:'cpu',proposalDigest:'abc123',stateRevision:'rev1',nonce:'nonce1234567890123456'};
const auth={signatureValid:true,receivingTeamVerified:true,authenticatedCpuConsent:true};
function adapter(){
 let current=ledger(),writes=0;
 return {read:async()=>current,compareAndSwap:async({expectedRevision,nextLedger})=>{
  await Promise.resolve();
  if(current.revision!==expectedRevision)return {committed:false};
  current=nextLedger;writes++;return {committed:true};
 },get writes(){return writes},get current(){return current}};
}
const options={experimentalEnabled:true,expectedLedgerRevision:0};
test('single adapter-reported commit is never represented as audited durability',async()=>{
 const a=adapter(),r=await attempt(a,receipt,'key',auth,options);
 assert.equal(r.ok,true);assert.equal(a.writes,1);
 assert.equal(r.durable,false);assert.equal(r.replayProtected,false);
 assert.equal(r.settlementAuthorized,false);assert.equal(r.saved,false);
});
test('two simultaneous attempts cannot both win an atomic adapter revision',async()=>{
 const a=adapter();
 const results=await Promise.all([attempt(a,receipt,'key',auth,options),
  attempt(a,receipt,'key',auth,options)]);
 assert.equal(results.filter(x=>x.ok).length,1);assert.equal(a.writes,1);
});
test('reload through same adapter detects consumed receipt',async()=>{
 const a=adapter();await attempt(a,receipt,'key',auth,options);
 const r=await attempt(a,receipt,'key',auth,{...options,expectedLedgerRevision:1});
 assert.equal(r.code,'authorization-already-consumed');assert.equal(a.writes,1);
});
test('cancel, decline, disabled, stale revision and unverified consent never write',async()=>{
 const a=adapter();
 for(const o of [{...options,cancelled:true},{...options,declined:true},
  {...options,experimentalEnabled:false},{...options,expectedLedgerRevision:2}]){
  const r=await attempt(a,receipt,'key',auth,o);
  assert.equal(r.ok,false);
 }
 assert.equal((await attempt(a,receipt,'key',{...auth,authenticatedCpuConsent:false},options)).ok,false);
 assert.equal(a.writes,0);
});
test('adapter failures and conflicts fail closed without settlement',async()=>{
 const a={read:async()=>ledger(),compareAndSwap:async()=>({committed:false})};
 const r=await attempt(a,receipt,'key',auth,options);
 assert.equal(r.ok,false);assert.equal(r.saved,false);
 assert.equal((await attempt({read:async()=>{throw Error('fail')},compareAndSwap:async()=>{}},receipt,'key',auth,options)).ok,false);
 assert.equal((await attempt({read:async()=>ledger(),compareAndSwap:async()=>{throw Error('fail')}},receipt,'key',auth,options)).ok,false);
});
