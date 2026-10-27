'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const {teams,build}=require('./hlm-phase11-new-franchise');
const engine={...require('./hlm-game-state'),...require('./hlm-phase10-season-schedule')};
const {buildProtectedAssetIntent}=require('./hlm-phase11-block-a-asset-intent-contract');
const {inspectAtomicPersistenceProtocol,REQUIRED}=require('./hlm-phase11-block-a-atomic-persistence-protocol');
test('atomic persistence protocol requires server-owned CAS, replay and linked asset commit',()=>{
 const source=JSON.parse(readFileSync(join(__dirname,'hlm-universe.json'),'utf8'));
 const state=build(source,teams(source)[0].id,engine),before=JSON.stringify(state);
 const intent=buildProtectedAssetIntent(source,state,{players:[],picks:[],prospects:[]},{},'rev-a',null,{gmApproved:true});
 const decision={decisionId:'forged',proposalDigest:intent.digest,stateRevision:'rev-a',decision:'accepted',verify:()=>true};
 const result=inspectAtomicPersistenceProtocol(intent,'rev-a',decision,{gmApproved:true,experimentalEnabled:true,serverTrusted:true,transaction:()=>{throw Error('untrusted callback invoked')}});
 assert.equal(result.status,'not-executable');
 assert.equal(result.settlementAuthorized,false);
 assert.equal(result.saved,false);
 assert.ok(result.blockers.includes('server-owned-transaction-coordinator-unavailable'));
 assert.ok(REQUIRED.includes('compare-expected-revision'));
 assert.ok(REQUIRED.includes('consume-cpu-decision'));
 assert.ok(REQUIRED.includes('commit-all-or-rollback'));
 assert.equal(JSON.stringify(state),before);
});
test('default-off, stale revision, cancel and decline never authorize persistence',()=>{
 const source=JSON.parse(readFileSync(join(__dirname,'hlm-universe.json'),'utf8'));
 const state=build(source,teams(source)[0].id,engine);
 const intent=buildProtectedAssetIntent(source,state,{players:[],picks:[],prospects:[]},{},'rev-a',null,{});
 for(const options of [{},{experimentalEnabled:true,gmApproved:true,cancelled:true},{experimentalEnabled:true,gmApproved:true,declined:true}]){
  const result=inspectAtomicPersistenceProtocol(intent,'rev-b',null,options);
  assert.ok(result.blockers.includes('stale-or-untrusted-revision'));
  assert.equal(result.saved,false);
  assert.equal(result.settlementAuthorized,false);
 }
});
