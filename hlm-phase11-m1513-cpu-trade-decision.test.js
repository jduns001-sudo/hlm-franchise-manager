'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {evaluate}=require('./hlm-phase11-m1513-cpu-trade-decision');
test('disabled, missing source and cancelled requests fail closed',()=>{
 for(const opts of [{},{experimentalEnabled:true,expectedGameRevision:0},{experimentalEnabled:true,cancelled:true}]){
  const r=evaluate(null,{},opts);assert.equal(r.ok,false);assert.equal(r.saved,false);
  assert.equal(r.receivingTeamConsentAuthenticated,false);assert.equal(r.settlementAuthorized,false);
 }
});
test('untrusted approval flags cannot manufacture CPU authorization',()=>{
 const r=evaluate(null,{authenticatedCpuConsent:true,gmApproved:true},
 {experimentalEnabled:true,expectedGameRevision:0,authenticatedCpuConsent:true,gmApproved:true});
 assert.equal(r.ok,false);assert.equal(r.receivingTeamConsentAuthenticated,false);
});
