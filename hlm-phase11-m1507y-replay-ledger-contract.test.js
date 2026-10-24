'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {fingerprint,propose}=require('./hlm-phase11-m1507y-replay-ledger-contract');
const ledger=()=>({schema:'hlm-m1507y-replay-ledger-v1',revision:0,consumed:{}});
const receipt={receivingTeamId:'cpu',proposalDigest:'abc123',stateRevision:'rev1',nonce:'nonce1234567890123456'};
const auth={signatureValid:true,receivingTeamVerified:true,authenticatedCpuConsent:true};
test('unverified or incomplete consent fails closed',()=>{
 for(const a of [null,{}, {...auth,authenticatedCpuConsent:false}, {...auth,signatureValid:false}])
  assert.equal(propose(ledger(),receipt,'key',a,{expectedLedgerRevision:0}).ok,false);
});
test('verified authorization proposes immutable transition, never commits or settles',()=>{
 const l=ledger(),before=JSON.stringify(l);
 const r=propose(l,receipt,'key',auth,{expectedLedgerRevision:0});
 assert.equal(r.ok,true);assert.equal(r.committed,false);assert.equal(r.durable,false);
 assert.equal(r.replayProtected,false);assert.equal(r.settlementAuthorized,false);
 assert.equal(r.nextLedger.revision,1);assert.equal(JSON.stringify(l),before);
});
test('already consumed fingerprint and stale ledger revision are rejected',()=>{
 const first=propose(ledger(),receipt,'key',auth,{expectedLedgerRevision:0});
 assert.equal(propose(first.nextLedger,receipt,'key',auth,{expectedLedgerRevision:1}).code,'authorization-already-consumed');
 assert.equal(propose(first.nextLedger,{...receipt,nonce:'anotherNonce123456'},'key',auth,{expectedLedgerRevision:0}).code,'stale-ledger-revision');
});
test('cancelled, declined and malformed ledgers cannot propose',()=>{
 for(const o of [{cancelled:true},{declined:true}])
  assert.equal(propose(ledger(),receipt,'key',auth,{expectedLedgerRevision:0,...o}).ok,false);
 for(const l of [null,{...ledger(),revision:-1},{...ledger(),consumed:[]},
  {...ledger(),consumed:{bad:true}}])
  assert.equal(propose(l,receipt,'key',auth,{expectedLedgerRevision:0}).ok,false);
});
test('fingerprint is bound to team, key, proposal, revision and nonce',()=>{
 const base={...receipt,keyId:'key'},hash=fingerprint(base);
 for(const k of ['receivingTeamId','keyId','proposalDigest','stateRevision','nonce'])
  assert.notEqual(fingerprint({...base,[k]:base[k]+'changed'}),hash);
});
test('two simultaneous previews cannot claim durable replay protection',()=>{
 const l=ledger(),a=propose(l,receipt,'key',auth,{expectedLedgerRevision:0});
 const b=propose(l,receipt,'key',auth,{expectedLedgerRevision:0});
 assert.equal(a.ok,true);assert.equal(b.ok,true);
 assert.equal(a.durable,false);assert.equal(b.durable,false);
 assert.equal(a.settlementAuthorized,false);assert.equal(b.settlementAuthorized,false);
});
