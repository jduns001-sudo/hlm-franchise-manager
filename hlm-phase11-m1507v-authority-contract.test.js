'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {verify}=require('./hlm-phase11-m1507v-authority-contract');
const {identity}=require('./hlm-phase11-m1507p-trade-authority-readiness');
const state={meta:{controlledTeamId:'gm'},universe:{players:[]},assets:{contracts:[]},finances:{}};
const proposal={outgoingPlayerId:'out',incomingPlayerId:'in'};
test('no receipt cannot authenticate or save',()=>{
 const before=JSON.stringify(state),r=verify(state,proposal,'rev');
 assert.equal(r.code,'missing-receiving-team-proof');
 assert.equal(r.settlementAuthorized,false);assert.equal(r.saved,false);
 assert.equal(JSON.stringify(state),before);
});
test('forged flags and matching digest never authenticate',()=>{
 const id=identity(state,proposal,'rev');
 const r=verify(state,proposal,'rev',{proposalDigest:id.digest,stateRevision:id.revision,
  receivingTeamId:'opponent',trusted:true,authenticated:true,signed:true,
  replayProtected:true,settlementAuthorized:true});
 assert.equal(r.independentlyAuthenticated,false);
 assert.equal(r.authenticatedCpuConsent,false);
 assert.equal(r.replayProtected,false);assert.equal(r.settlementAuthorized,false);
});
test('mismatched and stale revision receipts rejected',()=>{
 const id=identity(state,proposal,'rev1');
 for(const revision of ['rev2','rev3']){
  const r=verify(state,proposal,revision,{proposalDigest:id.digest,stateRevision:id.revision,receivingTeamId:'opponent'});
  assert.equal(r.code,'proposal-identity-mismatch');
 }
});
test('duplicate purported proof cannot become trusted by repetition',()=>{
 const id=identity(state,proposal,'rev');
 const receipt={proposalDigest:id.digest,stateRevision:id.revision,receivingTeamId:'opponent',nonce:'same'};
 for(let i=0;i<3;i++){
  const r=verify(state,proposal,'rev',receipt);
  assert.equal(r.settlementAuthorized,false);assert.equal(r.replayProtected,false);
 }
});
test('GM cancellation and decline block even matching purported receipt',()=>{
 const id=identity(state,proposal,'rev'),receipt={proposalDigest:id.digest,stateRevision:id.revision,receivingTeamId:'opponent'};
 for(const options of [{cancelled:true},{declined:true}]){
  const r=verify(state,proposal,'rev',receipt,options);
  assert.equal(r.code,'gm-declined-or-cancelled');assert.equal(r.saved,false);
 }
});
test('invalid input and absent receiving identity fail closed',()=>{
 assert.equal(verify(state,proposal,'',{}).code,'invalid-proposal-or-revision');
 const id=identity(state,proposal,'rev');
 assert.equal(verify(state,proposal,'rev',{proposalDigest:id.digest,stateRevision:id.revision}).code,'missing-receiving-team-identity');
});
