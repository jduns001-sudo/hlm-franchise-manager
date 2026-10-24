'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {reviewSettlementReadiness}=require('./hlm-phase11-m1514-transaction-integration-gate');
function source(){
 return {schemaVersion:1,meta:{revision:4,controlledTeamId:'A'},
 universe:{players:[{id:'pA',teamId:'A'},{id:'pB',teamId:'B'}],teams:[{id:'A'},{id:'B'}],leagues:[],prospects:[],staff:[]},
 assets:{contracts:[{playerId:'pA',teamId:'A',status:'active',aav:4,tradePermission:'allowed'},
 {playerId:'pB',teamId:'B',status:'active',aav:7,tradePermission:'allowed'}],draftPicks:[]},
 activity:{transactions:[],games:[],injuries:[]},history:{seasons:[],statistics:[],records:[]},
 finances:{teamCapLimits:{A:100,B:100}},extensions:{tradeRosterLimits:{A:30,B:30}}};
}
const input={outgoingPlayerId:'pA',incomingPlayerId:'pB'},options={experimentalEnabled:true,expectedGameRevision:4};
test('source-backed favorable CPU advisory still cannot authorize settlement',()=>{
 const r=reviewSettlementReadiness(source(),input,{...options,gmApproved:true,authenticatedCpuConsent:true,atomicSettlementVerified:true});
 assert.equal(r.advisory.decision,'recommend-accept');assert.equal(r.ready,false);
 assert.equal(r.cpuConsentAuthenticated,false);assert.equal(r.saved,false);
 assert.equal(r.settlementAuthorized,false);
});
test('cancel, decline, missing GM approval, stale source and disabled all fail closed',()=>{
 for(const opts of [{...options,cancelled:true},{...options,declined:true},options,
 {...options,expectedGameRevision:3},{...options,experimentalEnabled:false}]){
  const r=reviewSettlementReadiness(source(),input,opts);
  assert.equal(r.ready,false);assert.equal(r.saved,false);assert.equal(r.settlementAuthorized,false);
 }
});
test('no input mutation or source save',()=>{
 const state=source(),before=JSON.stringify(state);
 reviewSettlementReadiness(state,input,{...options,gmApproved:true});
 assert.equal(JSON.stringify(state),before);
});
