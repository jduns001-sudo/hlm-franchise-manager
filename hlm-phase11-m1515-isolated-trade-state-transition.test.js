'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {stage}=require('./hlm-phase11-m1515-isolated-trade-state-transition');
function source(){
 return {schemaVersion:1,meta:{revision:4,controlledTeamId:'A'},
 universe:{players:[{id:'pA',teamId:'A'},{id:'pB',teamId:'B'}],teams:[{id:'A'},{id:'B'}],leagues:[],prospects:[],staff:[]},
 assets:{contracts:[{playerId:'pA',teamId:'A',status:'active',aav:4,tradePermission:'allowed'},
 {playerId:'pB',teamId:'B',status:'active',aav:7,tradePermission:'allowed'}],draftPicks:[]},
 activity:{transactions:[],games:[],injuries:[]},history:{seasons:[],statistics:[],records:[]},
 finances:{teamCapLimits:{A:100,B:100}},extensions:{tradeRosterLimits:{A:30,B:30}}};
}
const input={outgoingPlayerId:'pA',incomingPlayerId:'pB'},opts={experimentalEnabled:true,expectedGameRevision:4,gmApproved:true};
test('source-backed player and active-contract transitions are coherent and never saved',()=>{
 const before=source(),snapshot=JSON.stringify(before),r=stage(before,input,opts);
 assert.equal(r.ok,true);assert.equal(r.saved,false);assert.equal(r.settlementAuthorized,false);
 assert.equal(r.receivingTeamConsentAuthenticated,false);
 assert.equal(JSON.stringify(before),snapshot);
 assert.equal(r.nextState.universe.players[0].teamId,'B');
 assert.equal(r.nextState.universe.players[1].teamId,'A');
 assert.equal(r.nextState.assets.contracts[0].teamId,'B');
 assert.equal(r.nextState.assets.contracts[1].teamId,'A');
 assert.equal(r.nextState.meta.revision,4);
});
test('GM decline, cancel, stale revision, and default off fail closed',()=>{
 for(const o of [{...opts,cancelled:true},{...opts,declined:true},
  {...opts,gmApproved:false},{...opts,expectedGameRevision:3},{...opts,experimentalEnabled:false}]){
  const r=stage(source(),input,o);assert.equal(r.ok,false);assert.equal(r.saved,false);
 }
});
test('invalid source contract ownership blocks transition',()=>{
 const s=source();s.assets.contracts[0].teamId='B';
 assert.equal(stage(s,input,opts).ok,false);
});
