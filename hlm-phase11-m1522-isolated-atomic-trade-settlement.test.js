'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {settleIsolated}=require('./hlm-phase11-m1522-isolated-atomic-trade-settlement');
function source(){return {schemaVersion:1,meta:{revision:4,controlledTeamId:'A'},
 universe:{players:[{id:'pA',teamId:'A'},{id:'pB',teamId:'B'}],teams:[{id:'A'},{id:'B'}],leagues:[],prospects:[],staff:[]},
 assets:{contracts:[{playerId:'pA',teamId:'A',status:'active',aav:4,tradePermission:'allowed'},
 {playerId:'pB',teamId:'B',status:'active',aav:7,tradePermission:'allowed'}],draftPicks:[]},
 activity:{transactions:[],games:[],injuries:[]},history:{seasons:[],statistics:[],records:[]},
 finances:{teamCapLimits:{A:100,B:100}},extensions:{tradeRosterLimits:{A:30,B:30}}};}
const trade={outgoingPlayerId:'pA',incomingPlayerId:'pB'};
const opts={experimentalEnabled:true,gmApproved:true,expectedGameRevision:4,eventId:'synthetic_1522_01'};
test('production settlement always blocked before storage access',async()=>{
 const s=source(),before=JSON.stringify(s);
 const r=await settleIsolated(s,trade,{...opts,realTradeSettlement:true,syntheticTestAuthorization:true});
 assert.equal(r.ok,false);assert.equal(r.saved,false);
 assert.equal(r.settlementAuthorized,false);assert.equal(JSON.stringify(s),before);
});
test('default off, cancel, decline, no GM and missing synthetic authorization fail closed',async()=>{
 for(const o of [{},{...opts,cancelled:true},{...opts,declined:true},
  {...opts,gmApproved:false},opts]){
  const r=await settleIsolated(source(),trade,o);
  assert.equal(r.ok,false);assert.equal(r.saved,false);
 }
});
test('CPU policy rejection and stale revision block synthetic settlement',async()=>{
 const s=source();s.assets.contracts[0].aav=9;
 const declined=await settleIsolated(s,trade,{...opts,syntheticTestAuthorization:true,authenticatedCpuConsent:true});
 assert.equal(declined.ok,false);assert.equal(declined.saved,false);
 const stale=await settleIsolated(source(),trade,{...opts,syntheticTestAuthorization:true,expectedGameRevision:3});
 assert.equal(stale.ok,false);assert.equal(stale.saved,false);
});
test('isolated storage failure cannot fall back to production writes',async()=>{
 const r=await settleIsolated(source(),trade,{...opts,syntheticTestAuthorization:true});
 assert.equal(r.ok,false);assert.equal(r.saved,false);
 assert.equal(r.settlementAuthorized,false);
});
