'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {createProtectedSettlementService}=require('./hlm-phase11-block-a-protected-settlement-service');
test('isolated protected service rejects forged GM/CPU claims without invoking caller callbacks',()=>{
 const state=createGameStateEnvelope(),original=JSON.stringify(state);
 let invoked=0;
 const hostile=()=>{invoked++;throw Error('browser callback must not execute')};
 const request={gmApproved:true,expectedRevision:'revision-1',
  intent:{digest:'fabricated'},cpuDecision:{decision:'accepted',verified:true},
  gmAuthenticated:true,cpuAuthenticated:true,verifyCpu:hostile,verifyGm:hostile,save:hostile};
 const service=createProtectedSettlementService({verifyCpu:hostile,verifyGm:hostile,save:hostile});
 const result=service.inspect(request,{revision:'revision-1',state,authenticated:true},{
  experimentalEnabled:true,verifyCpu:hostile,verifyGm:hostile,commit:hostile
 });
 assert.equal(result.status,'not-configured');
 assert.equal(result.verifiedGmSession,false);
 assert.equal(result.verifiedCpuConsent,false);
 assert.equal(result.settlementAuthorized,false);
 assert.equal(result.saved,false);
 assert.equal(result.productionSaved,false);
 assert.equal(invoked,0);
 assert.equal(JSON.stringify(state),original);
 assert.ok(result.reasons.includes('deployment-owned-gm-identity-provider-not-installed'));
 assert.ok(result.reasons.includes('deployment-owned-cpu-verifier-not-installed'));
 assert.ok(result.reasons.includes('deployment-owned-transaction-store-not-installed'));
});
test('default-off, cancelled, declined and stale requests never persist',()=>{
 const service=createProtectedSettlementService(),state=createGameStateEnvelope();
 for(const request of [
  {gmApproved:true,expectedRevision:'revision-1'},
  {gmApproved:true,expectedRevision:'revision-1',cancelled:true},
  {gmApproved:true,expectedRevision:'revision-1',declined:true},
  {gmApproved:true,expectedRevision:'outdated'}
 ]){
  const result=service.inspect(request,{revision:'revision-1',state});
  assert.equal(result.saved,false);
  assert.equal(result.settlementAuthorized,false);
 }
});
