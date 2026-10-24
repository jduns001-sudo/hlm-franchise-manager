'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const bridge=require('./hlm-phase11-m1517-guarded-trade-integration');
test('review is fail closed without GM approval or experimental enablement',()=>{
 const state={meta:{revision:1}};
 for(const options of [{},{experimentalEnabled:true},{experimentalEnabled:true,gmApproved:true,cancelled:true},
 {experimentalEnabled:true,gmApproved:true,declined:true}]){
  const r=bridge.review(state,{},options);
  assert.equal(r.ok,false);assert.equal(r.saved,false);assert.equal(r.settlementAuthorized,false);
 }
});
test('settlement cannot be authorized by caller supplied consent or synthetic flags',async()=>{
 const state={meta:{revision:1}};
 const r=await bridge.requestSettlement(state,{},{
  experimentalEnabled:true,gmApproved:true,receivingTeamConsentAuthenticated:true,syntheticTestAuthorization:true
 });
 assert.equal(r.saved,false);assert.equal(r.settlementAuthorized,false);
});
