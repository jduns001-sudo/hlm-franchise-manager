'use strict';
const assert=require('node:assert/strict');
globalThis.indexedDB=require('fake-indexeddb').indexedDB;
const store=require('./hlm-phase11-m1516-atomic-isolated-state-persistence');
const {tradeHistory}=require('./hlm-phase11-m1570-persisted-trade-history');
const {createHost}=require('./hlm-phase11-m1566-persisted-trade-review-host');
function source(){return {schemaVersion:1,meta:{revision:1,controlledTeamId:'A'},universe:{players:[{id:'pA',teamId:'A'},{id:'pB',teamId:'B'}],teams:[{id:'A'},{id:'B'}],leagues:[],prospects:[],staff:[]},assets:{contracts:[{playerId:'pA',teamId:'A',status:'active',aav:4,tradePermission:'allowed'},{playerId:'pB',teamId:'B',status:'active',aav:7,tradePermission:'allowed'}],draftPicks:[]},activity:{transactions:[],games:[],injuries:[]},history:{seasons:[],statistics:[],records:[]},finances:{teamCapLimits:{A:100,B:100}},extensions:{tradeRosterLimits:{A:30,B:30}}}}
(async()=>{
 const database='hlm-phase11-m1566-experimental-node-'+process.pid;
 const options={experimentalEnabled:true,syntheticTestAuthorization:true,experimentalDatabaseName:database};
 const request={outgoingPlayerId:'pA',incomingPlayerId:'pB'},approved={...request,gmApproved:true,expectedGameRevision:1};
 const state=source();
 assert.equal((await createHost().review(request)).code,'experiment-disabled');
 assert.equal((await createHost({...options,syntheticTestAuthorization:false}).settle(approved)).saved,false);
 assert.equal((await createHost({...options,realTradeSettlement:true}).review(request)).saved,false);
 assert.equal((await createHost({...options,experimentalDatabaseName:'hlm_front_office_v8'}).review(request)).saved,false);
 const host=createHost(options);
 assert.equal((await host.review(request)).code,'persisted-source-required');
 assert.equal((await store.commit({experimentalEnabled:true,syntheticTestAuthorization:true,gmApproved:true,expectedRevision:0,candidateState:state,eventId:'seed'},database)).saved,true);
 const before=await store.read(database);
 assert.equal((await host.settle(approved)).code,'review-required');
 const reviewed=await host.review({...request,terms:{revision:999},projectedPayroll:{A:0,B:0}});assert.equal(reviewed.ok,true,JSON.stringify(reviewed));
 assert.deepEqual(reviewed.terms,{revision:1,players:[
  {playerId:'pA',name:'pA',teamId:'A',teamName:'A',aav:4},
  {playerId:'pB',name:'pB',teamId:'B',teamName:'B',aav:7}
 ],teams:[
  {teamId:'A',name:'A',beforePayroll:4,afterPayroll:7,capLimit:100,remainingCap:93},
  {teamId:'B',name:'B',beforePayroll:7,afterPayroll:4,capLimit:100,remainingCap:96}
 ]},'terms use persisted contracts and planner totals, ignoring caller financial claims');
 assert.equal(Object.isFrozen(reviewed.terms),true);
 assert.equal(Object.isFrozen(reviewed.terms.players[0]),true);
 assert.equal(Object.isFrozen(reviewed.terms.teams[0]),true);
 assert.throws(()=>{reviewed.terms.teams[0].afterPayroll=0},TypeError);
 assert.deepEqual(await store.read(database),before,'review is read-only');
 assert.equal((await host.settle({...approved,gmApproved:false})).saved,false);
 assert.equal((await host.settle({...approved,incomingPlayerId:'pA'})).saved,false);
 assert.equal((await host.settle({...approved,cancelled:true})).saved,false);
 assert.deepEqual(await store.read(database),before,'decline and invalid approval do not write');
 assert.equal((await host.settle(approved)).code,'review-required');
 const other=createHost(options);
 assert.equal((await host.review(request)).ok,true);
 assert.equal((await other.review(request)).ok,true);
 const [first,duplicate]=await Promise.all([host.settle(approved),host.settle(approved)]);
 assert.equal(first.saved,true,first.code);assert.equal(first.settlementAuthorized,false);assert.equal(first.cpuConsentAuthenticated,false);
 assert.equal(duplicate.saved,false);assert.equal(duplicate.code,'settlement-pending');
 const stored=await store.read(database);
 assert.equal(stored.game.activity.transactions.length,1);
 const trade=stored.game.activity.transactions[0];
 assert.equal(trade.id,stored.ledger.events[1].id);assert.equal(trade.sourceRevision,1);assert.equal(trade.revision,2);
 assert.deepEqual(trade.transfers.map(p=>[p.playerId,p.fromTeamId,p.toTeamId,p.aav]),[['pA','A','B',4],['pB','B','A',7]]);
 assert.equal(tradeHistory(stored.game,stored.ledger).entries.length,1);
 assert.equal(stored.game.meta.revision,2);assert.equal(stored.ledger.events.length,2);
 assert.equal(stored.game.universe.players[0].teamId,'B');assert.equal(stored.game.assets.contracts[0].teamId,'B');
 assert.equal((await other.settle(approved)).saved,false,'another host cannot settle stale review');
 assert.deepEqual(await store.read(database),stored);
 assert.deepEqual(state,source(),'caller source never changes');
 const resumed=createHost(options);
 const next=await resumed.review({outgoingPlayerId:'pB',incomingPlayerId:'pA'});
 assert.equal(next.ok,false);assert.equal(next.code,'cpu-policy-declined');
 assert.equal(next.terms,undefined,'declined review exposes no stale or invented terms');
 assert.deepEqual(await store.read(database),stored,'resumed next review does not write');
 const full=source(),fullDatabase=database+'-full-payroll';
 full.universe.players.push({id:'pC',teamId:'A'});
 full.assets.contracts.push({playerId:'pC',teamId:'A',status:'active',aav:11,tradePermission:'allowed'},
  {playerId:'expired',teamId:'A',status:'expired',aav:999});
 await store.commit({experimentalEnabled:true,syntheticTestAuthorization:true,gmApproved:true,expectedRevision:0,candidateState:full,eventId:'seed'},fullDatabase);
 const fullBefore=await store.read(fullDatabase);
 const fullReview=await createHost({...options,experimentalDatabaseName:fullDatabase}).review(request);
 assert.equal(fullReview.ok,true,fullReview.code);
 assert.deepEqual(fullReview.terms.teams[0],{teamId:'A',name:'A',beforePayroll:15,afterPayroll:18,capLimit:100,remainingCap:82},'payroll includes other active contracts and excludes expired contracts');
 assert.deepEqual(await store.read(fullDatabase),fullBefore,'financial summary never writes');
 console.log('M1566 persisted host: explicit opt-in, approval, cancellation, atomic settlement, duplicate/stale rejection and resume passed');
})().catch(e=>{console.error(e);process.exitCode=1});
