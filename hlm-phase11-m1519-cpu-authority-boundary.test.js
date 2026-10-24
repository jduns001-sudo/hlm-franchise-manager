'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {decide,prepareForHumanReview}=require('./hlm-phase11-m1519-cpu-authority-boundary');
function source(){return {schemaVersion:1,meta:{revision:4,controlledTeamId:'A'},
 universe:{players:[{id:'pA',teamId:'A'},{id:'pB',teamId:'B'}],teams:[{id:'A'},{id:'B'}],leagues:[],prospects:[],staff:[]},
 assets:{contracts:[{playerId:'pA',teamId:'A',status:'active',aav:4,tradePermission:'allowed'},
 {playerId:'pB',teamId:'B',status:'active',aav:7,tradePermission:'allowed'}],draftPicks:[]},
 activity:{transactions:[],games:[],injuries:[]},history:{seasons:[],statistics:[],records:[]},
 finances:{teamCapLimits:{A:100,B:100}},extensions:{tradeRosterLimits:{A:30,B:30}}};}
const trade={outgoingPlayerId:'pA',incomingPlayerId:'pB'},options={experimentalEnabled:true,expectedGameRevision:4};
test('CPU policy decision comes from source, not supplied consent flags',()=>{
 const s=source(),r=decide(s,trade,{...options,authenticatedCpuConsent:true,syntheticTestAuthorization:true});
 assert.equal(r.ok,true);assert.equal(r.cpuDecision,'policy-accept');
 assert.equal(r.cpuConsentAuthenticated,false);assert.equal(r.saved,false);assert.equal(r.settlementAuthorized,false);
});
test('human review can stage an unsaved candidate after CPU policy approval',()=>{
 const s=source(),before=JSON.stringify(s),r=prepareForHumanReview(s,trade,{...options,gmApproved:true});
 assert.equal(r.ok,true);assert.equal(r.candidateState.meta.revision,5);
 assert.equal(r.candidateState.universe.players[0].teamId,'B');
 assert.equal(r.candidateState.assets.contracts[0].teamId,'B');
 assert.equal(r.saved,false);assert.equal(r.settlementAuthorized,false);
 assert.equal(JSON.stringify(s),before);
});
test('default off, cancel, stale revision, and no GM approval block review',()=>{
 for(const o of [{},{...options,cancelled:true},{...options,declined:true},
  {...options,expectedGameRevision:3},{...options,gmApproved:false}]){
  const r=prepareForHumanReview(source(),trade,o);
  assert.equal(r.ok,false);assert.equal(r.saved,false);
 }
});
test('CPU policy decline cannot be overridden by caller flags',()=>{
 const s=source();s.assets.contracts[0].aav=9;
 const r=prepareForHumanReview(s,trade,{...options,gmApproved:true,authenticatedCpuConsent:true});
 assert.equal(r.ok,false);assert.equal(r.settlementAuthorized,false);
});
