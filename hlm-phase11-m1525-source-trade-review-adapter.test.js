'use strict';
const assert=require('node:assert/strict');
globalThis.indexedDB=require('fake-indexeddb').indexedDB;
const store=require('./hlm-phase11-m1516-atomic-isolated-state-persistence');
const {createHost}=require('./hlm-phase11-m1525-source-trade-review-adapter');
(async()=>{
 const name='hlm-m1525-'+process.pid,host=createHost({experimentalEnabled:true,experimentalDatabaseName:name});
 const proposal={outgoingPlayerId:'pA',incomingPlayerId:'pB'};
 assert.equal((await host.review(proposal)).code,'persisted-source-required');
 assert.equal((await host.settle({...proposal,gmApproved:true})).saved,false);
 assert.equal((await createHost({experimentalDatabaseName:name}).review(proposal)).code,'experiment-disabled');
 const state={schemaVersion:1,meta:{revision:1,controlledTeamId:'A'},
 universe:{players:[{id:'pA',teamId:'A'},{id:'pB',teamId:'B'}],teams:[{id:'A'},{id:'B'}],leagues:[],prospects:[],staff:[]},
 assets:{contracts:[{playerId:'pA',teamId:'A',status:'active',aav:4,tradePermission:'allowed'},{playerId:'pB',teamId:'B',status:'active',aav:7,tradePermission:'allowed'}],draftPicks:[]},
 activity:{transactions:[],games:[],injuries:[]},history:{seasons:[],statistics:[],records:[]},
 finances:{teamCapLimits:{A:100,B:100}},extensions:{tradeRosterLimits:{A:30,B:30}}};
 const seed=await store.commit({experimentalEnabled:true,gmApproved:true,syntheticTestAuthorization:true,expectedRevision:0,candidateState:state,eventId:'seed_1525',realTradeSettlement:false},name);
 assert.equal(seed.saved,true);
 const before=await store.read(name);
 const result=await host.review(proposal);
 assert.equal(result.saved,false);
 assert.equal(result.settlementAuthorized,false);
 assert.equal(result.cpuConsentAuthenticated,false);
 assert.equal((await host.settle(proposal)).saved,false);
 assert.deepEqual(await store.read(name),before,'review and settlement denial cannot write');
 console.log('M1525 read-only source adapter, default-off, persisted guard and no-save verified:',result.code);
})().catch(e=>{console.error(e);process.exitCode=1});
