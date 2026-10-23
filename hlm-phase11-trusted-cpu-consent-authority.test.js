'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {assess,schema}=require('./hlm-phase11-trusted-cpu-consent-authority');
const state={meta:{controlledTeamId:'PIT'},teams:[{id:'PIT'},{id:'BOS'}]};
const input={outgoingPlayerId:'1',incomingPlayerId:'2'};
function assertBlocked(result){assert.equal(result.independentlyAuthenticated,false);assert.equal(result.settlementAuthorized,false);assert.equal(result.saved,false);assert.equal(result.atomicSettlementVerified,false);}
test('default off, invalid input and cancellation never authorize',()=>{
 for(const opts of [undefined,{enabled:true},{enabled:true,cancelled:true},{enabled:true,declined:true}]){
  assertBlocked(assess(null,null,'rev',null,opts));
 }
});
test('caller-controlled verification never runs and never authenticates',()=>{
 let called=0;
 const forged={schema,decisionId:'id-1',issuedAt:'2026-10-22T00:00:00Z',
 expiresAt:'2026-10-23T00:00:00Z',receivingTeamId:'BOS',
 proposalDigest:'forged',stateRevision:'rev',decision:'accepted',
 authorityProof:{signature:'forged'},verify(){called++;return true}};
 assertBlocked(assess(state,input,'rev',forged,{enabled:true,verifier:{verify(){called++;return true}},spent:{has(){called++;return false}}}));
 assert.equal(called,0);
});
test('replay-shaped and expired declarations never authorize',()=>{
 for(const decision of [{decisionId:'replayed'},{issuedAt:'2020-01-01',expiresAt:'2019-01-01'}]){
  assertBlocked(assess(state,input,'rev',decision,{enabled:true}));
 }
});
