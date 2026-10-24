'use strict';
const assert=require('node:assert/strict');
globalThis.indexedDB=require('fake-indexeddb').indexedDB;
const store=require('./hlm-phase11-m1516-atomic-isolated-state-persistence');
const {settlePersisted}=require('./hlm-phase11-m1523-persisted-source-trade-guard');
function state(){return {schemaVersion:1,meta:{revision:1,controlledTeamId:'A'},
 universe:{players:[{id:'pA',teamId:'A'},{id:'pB',teamId:'B'}],teams:[{id:'A'},{id:'B'}],leagues:[],prospects:[],staff:[]},
 assets:{contracts:[{playerId:'pA',teamId:'A',status:'active',aav:4,tradePermission:'allowed'},
 {playerId:'pB',teamId:'B',status:'active',aav:7,tradePermission:'allowed'}],draftPicks:[]},
 activity:{transactions:[],games:[],injuries:[]},history:{seasons:[],statistics:[],records:[]},
 finances:{teamCapLimits:{A:100,B:100}},extensions:{tradeRosterLimits:{A:30,B:30}}};}
(async()=>{
 const s=state(),trade={outgoingPlayerId:'pA',incomingPlayerId:'pB'},name='hlm-m1523-'+process.pid;
 const opts={experimentalEnabled:true,gmApproved:true,syntheticTestAuthorization:true,
 expectedGameRevision:1,eventId:'trade_1523',experimentalDatabaseName:name};
 const empty=await store.read(name);
 assert.equal((await settlePersisted(s,trade,opts)).saved,false,'uninitialized store must fail closed');
 assert.deepEqual(await store.read(name),empty);
 const seed=await store.commit({experimentalEnabled:true,gmApproved:true,syntheticTestAuthorization:true,
 expectedRevision:0,candidateState:s,eventId:'seed_1523',realTradeSettlement:false},name);
 assert.equal(seed.saved,true,seed.code);
 const initial=await store.read(name);
 assert.equal((await settlePersisted(s,trade,{...opts,cancelled:true})).saved,false);
 assert.equal((await settlePersisted(s,trade,{...opts,gmApproved:false})).saved,false);
 assert.equal((await settlePersisted(s,trade,{...opts,realTradeSettlement:true})).saved,false);
 const tampered=JSON.parse(JSON.stringify(s));tampered.universe.players[0].teamId='B';
 assert.equal((await settlePersisted(tampered,trade,opts)).saved,false);
 assert.deepEqual(await store.read(name),initial);
 const race=await Promise.all([settlePersisted(s,trade,opts),
 settlePersisted(s,trade,{...opts,eventId:'trade_1523_alt'})]);
 assert.equal(race.filter(x=>x.saved).length,1,'only one concurrent revision may commit');
 const saved=await store.read(name);
 assert.equal(saved.game.meta.revision,2);assert.equal(saved.ledger.revision,2);
 assert.equal(saved.game.universe.players.find(x=>x.id==='pA').teamId,'B');
 assert.equal(saved.game.assets.contracts.find(x=>x.playerId==='pA').teamId,'B');
 assert.equal(saved.game.universe.players.find(x=>x.id==='pB').teamId,'A');
 assert.equal(saved.game.assets.contracts.find(x=>x.playerId==='pB').teamId,'A');
 assert.equal((await settlePersisted(s,trade,opts)).saved,false);
 assert.deepEqual(await store.read(name),saved);
 console.log('M1523 seeded-state guard, no-save, atomic trade, concurrent stale rejection, reload and real settlement denial passed');
})().catch(e=>{console.error(e);process.exitCode=1});
