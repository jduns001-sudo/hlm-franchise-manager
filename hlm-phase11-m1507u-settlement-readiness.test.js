'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {inspect}=require('./hlm-phase11-m1507u-settlement-readiness');
const {identity}=require('./hlm-phase11-m1507p-trade-authority-readiness');
const source={meta:{controlledTeamId:'a'},universe:{players:[]},assets:{contracts:[]},finances:{}};
const proposal={outgoingPlayerId:'p1',incomingPlayerId:'p2'};
test('missing proof is fail closed and no storage is touched',()=>{
 const original=JSON.stringify(source);
 const r=inspect(source,proposal,'rev-1');
 assert.equal(r.settlementAuthorized,false);assert.equal(r.saved,false);
 assert.equal(r.independentlyAuthenticated,false);assert.equal(r.replayProtected,false);
 assert.ok(r.blockers.includes('durable-replay-ledger-unavailable'));
 assert.ok(r.blockers.includes('atomic-cross-asset-settlement-unavailable'));
 assert.equal(JSON.stringify(source),original);
});
test('forged caller flags never grant settlement',()=>{
 const id=identity(source,proposal,'rev-1');
 const r=inspect(source,proposal,'rev-1',{proposalDigest:id.digest,stateRevision:id.revision,
   authenticated:true,trusted:true,approved:true,settlementAuthorized:true});
 assert.equal(r.settlementAuthorized,false);assert.equal(r.independentlyAuthenticated,false);
 assert.equal(r.atomicSettlementVerified,false);
});
test('decline and cancel remain blocked regardless of purported receipt',()=>{
 for(const options of [{declined:true},{cancelled:true}]){
  const r=inspect(source,proposal,'rev-1',{trusted:true},options);
  assert.equal(r.code,'gm-declined-or-cancelled');
  assert.ok(r.blockers.includes('human-gm-declined-or-cancelled'));
  assert.equal(r.saved,false);
 }
});
test('invalid revision and mismatch remain fail closed',()=>{
 for(const revision of ['', 'x'.repeat(257)]){
  const r=inspect(source,proposal,revision,{});
  assert.equal(r.settlementAuthorized,false);
  assert.equal(r.code,'invalid-source-or-revision');
 }
});
