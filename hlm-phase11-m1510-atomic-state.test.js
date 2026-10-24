'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const ledger=require('./hlm-phase11-m1510-atomic-state');
test('experimental transaction fails closed when disabled or unapproved',async()=>{
 for(const input of [{},{experimentalEnabled:true},{experimentalEnabled:true,gmApproved:true},
  {experimentalEnabled:true,gmApproved:true,syntheticTestAuthorization:true,cancelled:true},
  {experimentalEnabled:true,gmApproved:true,syntheticTestAuthorization:true,declined:true}]){
  const result=await ledger.commit(input);assert.equal(result.committed,false);assert.equal(result.saved,false);
 }
});
test('cannot use synthetic transaction to authorize settlement',async()=>{
 const result=await ledger.commit({experimentalEnabled:true,gmApproved:true,syntheticTestAuthorization:true,
  expectedLedgerRevision:0,expectedGameRevision:0,fingerprint:'bad',eventId:'x'});
 assert.equal(result.settlementAuthorized,false);assert.equal(result.committed,false);
});
