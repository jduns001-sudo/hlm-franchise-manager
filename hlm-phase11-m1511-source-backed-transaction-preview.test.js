'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {inspect}=require('./hlm-phase11-m1511-source-backed-transaction-preview');
test('default off, cancel and decline never save',()=>{
 for(const options of [{},{experimentalEnabled:true,cancelled:true},{experimentalEnabled:true,declined:true}]){
  const r=inspect(null,null,options);assert.equal(r.saved,false);assert.equal(r.settlementAuthorized,false);
 }
});
test('malformed or stale game state fails closed',()=>{
 const state={meta:{revision:2,controlledTeamId:'A'}};
 assert.equal(inspect(state,{}, {experimentalEnabled:true,expectedGameRevision:2}).ok,false);
 assert.equal(inspect(state,{}, {experimentalEnabled:true,expectedGameRevision:1}).ok,false);
});
test('no authority flags can force a settlement',()=>{
 const r=inspect(null,{}, {experimentalEnabled:true,expectedGameRevision:0,authenticatedCpuConsent:true,gmApproved:true});
 assert.equal(r.settlementAuthorized,false);
});
