'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const {teams,build}=require('./hlm-phase11-new-franchise');
const engine={...require('./hlm-game-state'),...require('./hlm-phase10-season-schedule')};
const {buildProtectedAssetIntent}=require('./hlm-phase11-block-a-asset-intent-contract');
const {inspectProtectedServiceRequest}=require('./hlm-phase11-block-a-protected-service-request');
test('protected service refuses fabricated CPU approval and missing atomic replay + asset commit',()=>{
 const source=JSON.parse(readFileSync(join(__dirname,'hlm-universe.json'),'utf8'));
 const state=build(source,teams(source)[0].id,engine),before=JSON.stringify(state);
 const intent=buildProtectedAssetIntent(source,state,{players:[],picks:[],prospects:[]},{},'rev-1',null,{gmApproved:true});
 const decision={decisionId:'fake-id',proposalDigest:intent.digest,stateRevision:'rev-1',decision:'accepted',verify:()=>true};
 for(const options of [{},{gmApproved:true},{gmApproved:true,experimentalEnabled:true},{gmApproved:true,cancelled:true}]){
  const result=inspectProtectedServiceRequest(intent,'rev-1',decision,options);
  assert.equal(result.independentlyAuthenticated,false);
  assert.equal(result.replayProtected,false);
  assert.equal(result.atomicCommitAvailable,false);
  assert.equal(result.settlementAuthorized,false);
  assert.equal(result.saved,false);
  assert.ok(result.reasons.includes('replay-consumption-and-asset-write-not-atomic'));
 }
 const stale=inspectProtectedServiceRequest(intent,'rev-2',decision,{gmApproved:true});
 assert.ok(stale.reasons.includes('stale-or-untrusted-revision'));
 const forged=inspectProtectedServiceRequest(intent,'rev-1',{...decision,proposalDigest:'forged'},{gmApproved:true});
 assert.ok(forged.reasons.includes('cpu-decision-binding-invalid'));
 assert.equal(JSON.stringify(state),before);
});
