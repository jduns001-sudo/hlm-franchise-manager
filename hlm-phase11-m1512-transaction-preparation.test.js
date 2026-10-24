'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {prepare}=require('./hlm-phase11-m1512-transaction-preparation');
test('preparation remains disabled and fails closed for malformed source',()=>{
 for(const options of [{},{experimentalEnabled:true,expectedGameRevision:0},
  {experimentalEnabled:true,cancelled:true},{experimentalEnabled:true,declined:true}]){
  const r=prepare(null,{},options);
  assert.equal(r.prepared,false);assert.equal(r.saved,false);assert.equal(r.settlementAuthorized,false);
 }
});
test('caller assertions cannot fabricate CPU consent or settlement',()=>{
 const r=prepare(null,{receivingTeamConsentAuthenticated:true,gmApproved:true},
  {experimentalEnabled:true,expectedGameRevision:0,gmApproved:true,authenticatedCpuConsent:true});
 assert.equal(r.prepared,false);assert.equal(r.settlementAuthorized,false);
});
