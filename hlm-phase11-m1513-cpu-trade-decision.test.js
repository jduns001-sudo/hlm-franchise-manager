'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {evaluate}=require('./hlm-phase11-m1513-cpu-trade-decision');
test('disabled, missing source and cancelled requests fail closed',()=>{
 for(const opts of [{},{experimentalEnabled:true,expectedGameRevision:0},{experimentalEnabled:true,cancelled:true}]){
  const r=evaluate(null,{},opts);assert.equal(r.ok,false);assert.equal(r.saved,false);
  assert.equal(r.receivingTeamConsentAuthenticated,false);assert.equal(r.settlementAuthorized,false);
 }
});
test('untrusted approval flags cannot manufacture CPU authorization',()=>{
 const r=evaluate(null,{authenticatedCpuConsent:true,gmApproved:true},
 {experimentalEnabled:true,expectedGameRevision:0,authenticatedCpuConsent:true,gmApproved:true});
 assert.equal(r.ok,false);assert.equal(r.receivingTeamConsentAuthenticated,false);
});

function state(aavA,aavB){
 return {schemaVersion:1,meta:{revision:4,controlledTeamId:'A'},
 universe:{players:[{id:'pA',teamId:'A'},{id:'pB',teamId:'B'}],teams:[{id:'A'},{id:'B'}],leagues:[],prospects:[],staff:[]},
 assets:{contracts:[{playerId:'pA',teamId:'A',status:'active',aav:aavA,tradePermission:'allowed'},
 {playerId:'pB',teamId:'B',status:'active',aav:aavB,tradePermission:'allowed'}],draftPicks:[]},
 activity:{transactions:[],games:[],injuries:[]},history:{seasons:[],statistics:[],records:[]},
 finances:{teamCapLimits:{A:100,B:100}},extensions:{tradeRosterLimits:{A:30,B:30}}};
}
const input={outgoingPlayerId:'pA',incomingPlayerId:'pB'},options={experimentalEnabled:true,expectedGameRevision:4};
test('source-backed advisory deterministically recommends accept or decline without authorization',()=>{
 const yes=evaluate(state(4,7),input,options),no=evaluate(state(8,3),input,options);
 assert.equal(yes.ok,true);assert.equal(yes.decision,'recommend-accept');
 assert.equal(no.ok,true);assert.equal(no.decision,'recommend-decline');
 for(const r of [yes,no]){assert.equal(r.receivingTeamConsentAuthenticated,false);
  assert.equal(r.settlementAuthorized,false);assert.equal(r.saved,false)}
 assert.deepEqual(evaluate(state(4,7),input,options),yes);
});
test('stale source, missing restriction and cap violations cannot yield CPU advisory',()=>{
 const stale=evaluate(state(4,7),input,{...options,expectedGameRevision:3});
 assert.equal(stale.ok,false);
 const missing=state(4,7);delete missing.assets.contracts[0].tradePermission;
 assert.equal(evaluate(missing,input,options).ok,false);
 const cap=state(4,7);cap.finances.teamCapLimits.A=1;
 assert.equal(evaluate(cap,input,options).ok,false);
});
