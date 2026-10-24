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

function source(){
 return {schemaVersion:1,meta:{revision:4,controlledTeamId:'A'},
 universe:{players:[{id:'pA',teamId:'A'},{id:'pB',teamId:'B'}],teams:[{id:'A'},{id:'B'}],leagues:[],prospects:[],staff:[]},
 assets:{contracts:[{playerId:'pA',teamId:'A',status:'active',aav:4,tradePermission:'allowed'},
 {playerId:'pB',teamId:'B',status:'active',aav:7,tradePermission:'allowed'}],draftPicks:[]},
 activity:{transactions:[],games:[],injuries:[]},history:{seasons:[],statistics:[],records:[]},
 finances:{teamCapLimits:{A:100,B:100}},extensions:{tradeRosterLimits:{A:30,B:30}}};
}
const trade={outgoingPlayerId:'pA',incomingPlayerId:'pB'};
const approved={experimentalEnabled:true,expectedGameRevision:4,gmApproved:true};
test('successful source-backed review swaps players and contracts only in unsaved candidate',()=>{
 const original=source(),snapshot=JSON.stringify(original);
 const result=bridge.review(original,trade,approved);
 assert.equal(result.ok,true);assert.equal(result.saved,false);
 assert.equal(result.settlementAuthorized,false);assert.equal(result.receivingTeamConsentAuthenticated,false);
 assert.equal(result.expectedRevision,4);assert.equal(result.candidateState.meta.revision,5);
 assert.equal(result.candidateState.universe.players[0].teamId,'B');
 assert.equal(result.candidateState.universe.players[1].teamId,'A');
 assert.equal(result.candidateState.assets.contracts[0].teamId,'B');
 assert.equal(result.candidateState.assets.contracts[1].teamId,'A');
 assert.equal(JSON.stringify(original),snapshot);
});
test('review blocks stale revisions and mismatched source contracts',()=>{
 assert.equal(bridge.review(source(),trade,{...approved,expectedGameRevision:3}).ok,false);
 const broken=source();broken.assets.contracts[0].teamId='B';
 assert.equal(bridge.review(broken,trade,approved).ok,false);
});
test('settlement rejects valid review even with spoofed CPU consent',async()=>{
 const original=source(),snapshot=JSON.stringify(original);
 const result=await bridge.requestSettlement(original,trade,{...approved,receivingTeamConsentAuthenticated:true,syntheticTestAuthorization:true});
 assert.equal(result.ok,false);assert.equal(result.reviewAvailable,true);
 assert.equal(result.saved,false);assert.equal(result.settlementAuthorized,false);
 assert.equal(JSON.stringify(original),snapshot);
});
