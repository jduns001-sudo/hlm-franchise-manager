'use strict';
const assert=require('node:assert/strict');
globalThis.indexedDB=require('fake-indexeddb').indexedDB;
const source=require('./hlm-phase11-m1571-multitrade.fixture');
const store=require('./hlm-phase11-m1516-atomic-isolated-state-persistence');
const {createHost}=require('./hlm-phase11-m1566-persisted-trade-review-host');
const {listPlayers}=require('./hlm-phase11-m1568-trade-player-options');
(async()=>{
 const name='hlm-phase11-m1571-experimental-node-'+process.pid;
 const options={experimentalEnabled:true,syntheticTestAuthorization:true,experimentalDatabaseName:name};
 const original=source();
 assert.equal((await store.commit({...options,gmApproved:true,expectedRevision:0,candidateState:original,eventId:'seed'},name)).saved,true);
 let saved;
 for(const [revision,outgoingPlayerId,incomingPlayerId] of [[1,'pA','pB'],[2,'pB','pC']]){
  const before=await store.read(name),request={outgoingPlayerId,incomingPlayerId};
  const host=createHost(options),stale=createHost(options);
  const reviewed=await host.review(request);assert.equal(reviewed.ok,true,reviewed.code);
  assert.equal(reviewed.revision,revision);
  assert.equal((await stale.review(request)).ok,true);
  const approval={...request,gmApproved:true,expectedGameRevision:revision};
  assert.equal((await host.settle({...approval,declined:true})).saved,false);
  assert.deepEqual(await store.read(name),before,'decline preserves all earlier history');
  assert.equal((await host.review(request)).ok,true);
  assert.equal((await host.settle(approval)).saved,true);
  saved=await store.read(name);
  assert.equal(saved.game.meta.revision,revision+1);
  assert.equal(saved.game.activity.transactions.length,revision);
  assert.equal(saved.ledger.events.length,revision+1);
  assert.deepEqual(saved.game.activity.transactions.slice(0,-1),before.game.activity.transactions,'earlier transaction details remain unchanged');
  assert.equal((await stale.settle(approval)).saved,false);
  assert.deepEqual(await store.read(name),saved,'stale host cannot add duplicate history');
  const resumed=await listPlayers(options);assert.equal(resumed.ok,true);
  assert.deepEqual(resumed.outgoing.map(p=>p.id),[incomingPlayerId]);
  assert.equal(resumed.history.entries.length,revision);
 }
 assert.deepEqual(saved.game.universe.players.map(p=>[p.id,p.teamId]),[['pA','B'],['pB','C'],['pC','A']]);
 assert.deepEqual(saved.game.assets.contracts.map(c=>[c.playerId,c.teamId,c.aav]),[['pA','B',4],['pB','C',7],['pC','A',9]]);
 assert.deepEqual(saved.game.activity.transactions.map(t=>t.transfers.map(p=>[p.playerId,p.fromTeamId,p.toTeamId])),[
  [['pA','A','B'],['pB','B','A']],[['pB','A','C'],['pC','C','A']]
 ]);
 const resumed=createHost(options),before=await store.read(name);
 const blocked=await resumed.review({outgoingPlayerId:'pC',incomingPlayerId:'pA'});
 assert.equal(blocked.code,'cpu-policy-declined');
 assert.deepEqual(await store.read(name),before);
 assert.deepEqual(original,source(),'source fixture never mutates');
 console.log('M1571 two consecutive approved trades: three-team ownership, contracts, ordered durable history, decline, stale rejection and next CPU policy passed');
})().catch(e=>{console.error(e);process.exitCode=1});
