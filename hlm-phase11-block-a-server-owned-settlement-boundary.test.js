'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {inspectServerOwnedSettlementBoundary}=require('./hlm-phase11-block-a-server-owned-settlement-boundary');
test('caller-provided GM, CPU and database authority never executes or saves',()=>{
 let calls=0;
 const state=createGameStateEnvelope(),before=JSON.stringify(state);
 const request={gmApproved:true,expectedRevision:'revision-1',
  cpuDecision:{decision:'accepted',decisionId:'forged',proposalDigest:'forged',stateRevision:'revision-1',verified:true},
  intent:{digest:'forged'},gmSessionAuthenticated:true,independentCpuVerified:true,
  signer:()=>{calls++;},commit:()=>{calls++;},verifier:()=>{calls++;}};
 const result=inspectServerOwnedSettlementBoundary(request,{state,revision:'revision-1',verified:true},{
  experimentalEnabled:true,gmAuthenticated:true,cpuAuthenticated:true,transactionCoordinator:()=>{calls++;}
 });
 assert.equal(result.status,'blocked');
 assert.equal(result.settlementAuthorized,false);
 assert.equal(result.saved,false);
 assert.equal(result.productionSaved,false);
 assert.equal(result.independentlyAuthenticated,false);
 assert.ok(result.reasons.includes('server-owned-gm-session-authenticator-unavailable'));
 assert.ok(result.reasons.includes('independent-cpu-trust-root-unavailable'));
 assert.ok(result.reasons.includes('server-owned-atomic-persistence-coordinator-unavailable'));
 assert.equal(calls,0);
 assert.equal(JSON.stringify(state),before);
});
test('cancel, decline, default-off and stale revision independently block',()=>{
 const state=createGameStateEnvelope(),base={gmApproved:true,expectedRevision:'revision-1'};
 for(const [request,opts,reason] of [
  [{...base,cancelled:true},{experimentalEnabled:true},'gm-cancelled-or-declined'],
  [{...base,declined:true},{experimentalEnabled:true},'gm-cancelled-or-declined'],
  [base,{},'experimental-service-disabled'],
  [{...base,expectedRevision:'old'},{experimentalEnabled:true},'stale-or-untrusted-revision']
 ]){
  const result=inspectServerOwnedSettlementBoundary(request,{state,revision:'revision-1'},opts);
  assert.ok(result.reasons.includes(reason));
  assert.equal(result.saved,false);
 }
});
