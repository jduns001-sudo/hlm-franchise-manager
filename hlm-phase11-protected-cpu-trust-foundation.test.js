'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {assess}=require('./hlm-phase11-protected-cpu-trust-foundation');
const valid={decisionId:'d1',receivingTeamId:'BOS',proposalDigest:'digest',
 stateRevision:'rev',issuedAt:'2026-10-22T00:00:00Z',
 expiresAt:'2026-10-23T00:00:00Z',decision:'accepted'};
function denied(x){assert.equal(x.saved,false);assert.equal(x.settlementAuthorized,false);
 assert.equal(x.independentlyAuthenticated,false);assert.equal(x.replayProtected,false);
 assert.equal(x.gmApproved,false);assert.equal(x.experimental,true);}
test('default disabled, cancellation, and decline always deny',()=>{
 for(const opts of [undefined,{}, {enabled:false},{enabled:true,cancelled:true},{enabled:true,declined:true}])
  denied(assess(valid,opts));
});
test('malformed, forged, stale-shaped and expired-shaped requests deny',()=>{
 for(const x of [null,[],{}, {...valid,decision:'declined'}, {...valid,proposalDigest:''},
  {...valid,stateRevision:null},{...valid,expiresAt:'2019-01-01T00:00:00Z'},
  {...valid,decisionId:''}])denied(assess(x,{enabled:true}));
});
test('caller-provided trust and replay callbacks are never executed',()=>{
 let calls=0;const poison=()=>{calls++;throw Error('untrusted callback executed')};
 const x=assess({...valid,verify:poison,authorityProof:{signature:'forged'}},
  {enabled:true,verifier:{verify:poison},replayStore:{has:poison,setItem:poison},gmApproved:true});
 denied(x);assert.equal(x.code,'protected-service-and-replay-ledger-unavailable');assert.equal(calls,0);
});
test('frozen deny result cannot be promoted to authorization',()=>{
 const x=assess(valid,{enabled:true});
 assert.equal(Object.isFrozen(x),true);denied(x);
 assert.throws(()=>{x.saved=true},TypeError);denied(x);
});
