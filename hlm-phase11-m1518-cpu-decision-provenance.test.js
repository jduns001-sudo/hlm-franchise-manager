'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {evidence,verify}=require('./hlm-phase11-m1518-cpu-decision-provenance');
function source(){return {schemaVersion:1,meta:{revision:4,controlledTeamId:'A'},
 universe:{players:[{id:'pA',teamId:'A'},{id:'pB',teamId:'B'}],teams:[{id:'A'},{id:'B'}],leagues:[],prospects:[],staff:[]},
 assets:{contracts:[{playerId:'pA',teamId:'A',status:'active',aav:4,tradePermission:'allowed'},
 {playerId:'pB',teamId:'B',status:'active',aav:7,tradePermission:'allowed'}],draftPicks:[]},
 activity:{transactions:[],games:[],injuries:[]},history:{seasons:[],statistics:[],records:[]},
 finances:{teamCapLimits:{A:100,B:100}},extensions:{tradeRosterLimits:{A:30,B:30}}};}
const input={outgoingPlayerId:'pA',incomingPlayerId:'pB'},options={experimentalEnabled:true,expectedGameRevision:4};
test('advisory evidence binds exact players, teams, revision and decision but never grants consent',()=>{
 const state=source(),record=evidence(state,input,options);
 assert.equal(record.ok,true);assert.equal(record.payload.decision,'recommend-accept');
 assert.equal(record.authenticatedCpuConsent,false);assert.equal(record.settlementAuthorized,false);
 const checked=verify(state,input,record,options);
 assert.equal(checked.valid,true);assert.equal(checked.authenticatedCpuConsent,false);
});
test('stale revision and tampering fail closed',()=>{
 const state=source(),record=evidence(state,input,options);
 assert.equal(verify(state,input,{...record,digest:'0'.repeat(64)},options).valid,false);
 assert.equal(verify(state,input,{...record,payload:{...record.payload,otherTeamId:'C'}},options).valid,false);
 assert.equal(verify(state,input,record,{...options,expectedGameRevision:3}).valid,false);
 state.meta.revision=5;
 assert.equal(verify(state,input,record,options).valid,false);
});
test('default off and cancellation never issue decision evidence',()=>{
 for(const o of [{},{...options,cancelled:true},{...options,declined:true}]){
  const result=evidence(source(),input,o);
  assert.equal(result.ok,false);assert.equal(result.saved,false);
 }
});
