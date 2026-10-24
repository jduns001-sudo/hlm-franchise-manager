'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {commit}=require('./hlm-phase11-m1516-atomic-isolated-state-persistence');
function state(revision){return {schemaVersion:1,meta:{revision,controlledTeamId:'A'},
 universe:{players:[],teams:[],leagues:[],prospects:[],staff:[]},
 assets:{contracts:[],draftPicks:[]},activity:{transactions:[],games:[],injuries:[]},
 history:{seasons:[],statistics:[],records:[]},finances:{},extensions:{}}}
test('production-disabled, cancelled, declined, unapproved and real settlement requests cannot write',async()=>{
 for(const input of [
  {},{experimentalEnabled:true,cancelled:true},{experimentalEnabled:true,declined:true},
  {experimentalEnabled:true,gmApproved:false},
  {experimentalEnabled:true,gmApproved:true,syntheticTestAuthorization:true,realTradeSettlement:true}]){
  const r=await commit({...input,expectedRevision:0,candidateState:state(1),eventId:'event1'});
  assert.equal(r.committed,false);assert.equal(r.saved,false);assert.equal(r.settlementAuthorized,false);
 }
});
test('invalid candidate revision and envelope fail closed',async()=>{
 const r=await commit({experimentalEnabled:true,gmApproved:true,syntheticTestAuthorization:true,
 expectedRevision:0,candidateState:state(0),eventId:'event1'});
 assert.equal(r.committed,false);assert.equal(r.saved,false);
});
