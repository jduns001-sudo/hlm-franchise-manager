'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const {teams,build}=require('./hlm-phase11-new-franchise');
const engine={...require('./hlm-game-state'),...require('./hlm-phase10-season-schedule')};
const {inspectSettlementBoundary}=require('./hlm-phase11-block-a-protected-settlement-boundary');
test('real universe cannot settle player, contract, pick or prospect assets without protected authority',()=>{
 const source=JSON.parse(readFileSync(join(__dirname,'hlm-universe.json'),'utf8'));
 const state=build(source,teams(source)[0].id,engine),before=JSON.stringify(state);
 const proposal={players:[],picks:[],prospects:[]};
 for(const options of [{},{gmApproved:true,experimentalEnabled:true},{gmApproved:true,experimentalEnabled:true,cancelled:true},{gmApproved:true,declined:true}]){
  const result=inspectSettlementBoundary(source,state,proposal,{receivingTeamId:'forged'},'forged-revision',{decision:'accepted',verify:()=>true},options);
  assert.equal(result.status,'settlement-blocked');
  assert.equal(result.cpuConsentAuthenticated,false);
  assert.equal(result.replayProtected,false);
  assert.equal(result.atomicCommitAvailable,false);
  assert.equal(result.settlementAuthorized,false);
  assert.equal(result.saved,false);
 }
 assert.equal(JSON.stringify(state),before);
});
