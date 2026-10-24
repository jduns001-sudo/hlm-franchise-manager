'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {inspect}=require('./hlm-phase11-m1520-settlement-preflight');
const {prepareForHumanReview}=require('./hlm-phase11-m1519-cpu-authority-boundary');
function source(){return {schemaVersion:1,meta:{revision:4,controlledTeamId:'A'},
 universe:{players:[{id:'pA',teamId:'A'},{id:'pB',teamId:'B'}],teams:[{id:'A'},{id:'B'}],leagues:[],prospects:[],staff:[]},
 assets:{contracts:[{playerId:'pA',teamId:'A',status:'active',aav:4,tradePermission:'allowed'},
 {playerId:'pB',teamId:'B',status:'active',aav:7,tradePermission:'allowed'}],draftPicks:[]},
 activity:{transactions:[],games:[],injuries:[]},history:{seasons:[],statistics:[],records:[]},
 finances:{teamCapLimits:{A:100,B:100}},extensions:{tradeRosterLimits:{A:30,B:30}}};}
const trade={outgoingPlayerId:'pA',incomingPlayerId:'pB'},opts={experimentalEnabled:true,expectedGameRevision:4,gmApproved:true};
test('preflight validates staged ownership but never authorizes settlement',()=>{
 const s=source(),before=JSON.stringify(s),r=inspect(s,trade,opts);
 assert.equal(r.ok,true);assert.equal(r.sourceOwnershipConsistent,true);
 assert.equal(r.cpuConsentAuthenticated,false);assert.equal(r.readyToSettle,false);
 assert.equal(r.saved,false);assert.equal(r.settlementAuthorized,false);
 assert.equal(JSON.stringify(s),before);
});
test('preflight rejects disabled, cancelled, declined, unapproved and stale',()=>{
 for(const o of [{},{...opts,cancelled:true},{...opts,declined:true},
  {...opts,gmApproved:false},{...opts,expectedGameRevision:3}]){
  const r=inspect(source(),trade,o);assert.equal(r.ok,false);
  assert.equal(r.saved,false);assert.equal(r.settlementAuthorized,false);
 }
});
test('preflight rejects CPU policy decline despite forged consent',()=>{
 const s=source();s.assets.contracts[0].aav=9;
 const r=inspect(s,trade,{...opts,authenticatedCpuConsent:true,syntheticTestAuthorization:true});
 assert.equal(r.ok,false);assert.equal(r.settlementAuthorized,false);
});
test('preflight exposes no commit capability',()=>{
 assert.equal(typeof require('./hlm-phase11-m1520-settlement-preflight').commit,'undefined');
 assert.equal(typeof prepareForHumanReview,'function');
});
