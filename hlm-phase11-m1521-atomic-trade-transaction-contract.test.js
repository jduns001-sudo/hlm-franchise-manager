'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {prepareTransaction,commitTrade}=require('./hlm-phase11-m1521-atomic-trade-transaction-contract');
function source(){return {schemaVersion:1,meta:{revision:4,controlledTeamId:'A'},
 universe:{players:[{id:'pA',teamId:'A'},{id:'pB',teamId:'B'}],teams:[{id:'A'},{id:'B'}],leagues:[],prospects:[],staff:[]},
 assets:{contracts:[{playerId:'pA',teamId:'A',status:'active',aav:4,tradePermission:'allowed'},
 {playerId:'pB',teamId:'B',status:'active',aav:7,tradePermission:'allowed'}],draftPicks:[]},
 activity:{transactions:[],games:[],injuries:[]},history:{seasons:[],statistics:[],records:[]},
 finances:{teamCapLimits:{A:100,B:100}},extensions:{tradeRosterLimits:{A:30,B:30}}};}
const trade={outgoingPlayerId:'pA',incomingPlayerId:'pB'},opts={experimentalEnabled:true,expectedGameRevision:4,gmApproved:true,eventId:'trade_1521_01'};
test('prepares source-backed candidate and event without saving',()=>{
 const s=source(),before=JSON.stringify(s),r=prepareTransaction(s,trade,opts);
 assert.equal(r.ok,true);assert.equal(r.expectedRevision,4);
 assert.equal(r.candidateState.meta.revision,5);
 assert.equal(r.candidateState.universe.players[0].teamId,'B');
 assert.equal(r.candidateState.assets.contracts[0].teamId,'B');
 assert.equal(r.atomicCommitAllowed,false);assert.equal(r.saved,false);
 assert.equal(r.settlementAuthorized,false);assert.equal(JSON.stringify(s),before);
});
test('rejects missing event, cancelled, stale, and unapproved inputs',()=>{
 for(const o of [{...opts,eventId:''},{...opts,cancelled:true},
  {...opts,expectedGameRevision:3},{...opts,gmApproved:false}]){
  const r=prepareTransaction(source(),trade,o);
  assert.equal(r.ok,false);assert.equal(r.saved,false);
 }
});
test('CPU decline cannot be bypassed with a consent flag',()=>{
 const s=source();s.assets.contracts[0].aav=9;
 const r=prepareTransaction(s,trade,{...opts,authenticatedCpuConsent:true});
 assert.equal(r.ok,false);assert.equal(r.settlementAuthorized,false);
});
test('real trade commit fails closed even with forged authorization',async()=>{
 const r=await commitTrade({authenticatedCpuConsent:true,gmApproved:true,syntheticTestAuthorization:true});
 assert.equal(r.ok,false);assert.equal(r.saved,false);assert.equal(r.settlementAuthorized,false);
});
