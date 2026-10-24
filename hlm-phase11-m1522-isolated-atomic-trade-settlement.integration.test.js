'use strict';
/* End-to-end execution of the M1522 facade using a standards-compatible
 * IndexedDB implementation. This does not authorize real-world CPU consent.
 */
const assert=require('node:assert/strict');
const {indexedDB}=require('fake-indexeddb');
globalThis.indexedDB=indexedDB;
const {settleIsolated}=require('./hlm-phase11-m1522-isolated-atomic-trade-settlement');
const store=require('./hlm-phase11-m1516-atomic-isolated-state-persistence');
function source(){return {schemaVersion:1,meta:{revision:0,controlledTeamId:'A'},
 universe:{players:[{id:'pA',teamId:'A'},{id:'pB',teamId:'B'}],teams:[{id:'A'},{id:'B'}],leagues:[],prospects:[],staff:[]},
 assets:{contracts:[{playerId:'pA',teamId:'A',status:'active',aav:4,tradePermission:'allowed'},
 {playerId:'pB',teamId:'B',status:'active',aav:7,tradePermission:'allowed'}],draftPicks:[]},
 activity:{transactions:[],games:[],injuries:[]},history:{seasons:[],statistics:[],records:[]},
 finances:{teamCapLimits:{A:100,B:100}},extensions:{tradeRosterLimits:{A:30,B:30}}};}
(async()=>{
 const s=source(),input={outgoingPlayerId:'pA',incomingPlayerId:'pB'},name='hlm-m1522-facade-acceptance';
 const options={experimentalEnabled:true,gmApproved:true,syntheticTestAuthorization:true,
  expectedGameRevision:0,eventId:'facade_trade_1',experimentalDatabaseName:name};
 const before=await store.read(name);
 assert.equal(before.game,null);
 const cancelled=await settleIsolated(s,input,{...options,cancelled:true});
 assert.equal(cancelled.saved,false);
 assert.deepEqual(await store.read(name),before);
 const first=await settleIsolated(s,input,options);
 assert.equal(first.ok,true,first.code);assert.equal(first.saved,true);
 assert.equal(first.settlementAuthorized,false);assert.equal(first.cpuConsentAuthenticated,false);
 const after=await store.read(name);
 assert.equal(after.game.meta.revision,1);
 for(const [id,team] of [['pA','B'],['pB','A']]){
  assert.equal(after.game.universe.players.find(x=>x.id===id).teamId,team);
  assert.equal(after.game.assets.contracts.find(x=>x.playerId===id).teamId,team);
 }
 assert.deepEqual(after.ledger.events,[{id:'facade_trade_1',experimental:true}]);
 const replay=await settleIsolated(s,input,options);
 assert.equal(replay.ok,false);assert.equal(replay.saved,false);
 const concurrent=await Promise.all([
  settleIsolated(s,input,{...options,eventId:'facade_trade_2'}),
  settleIsolated(s,input,{...options,eventId:'facade_trade_3'})
 ]);
 assert.equal(concurrent.filter(x=>x.saved).length,0);
 const real=await settleIsolated(s,input,{...options,realTradeSettlement:true});
 assert.equal(real.saved,false);
 assert.deepEqual(await store.read(name),after);
 console.log('M1522 facade: synthetic atomic commit, ownership, reload read, replay/stale, cancellation and real settlement denial passed');
})().catch(e=>{console.error(e);process.exitCode=1});
