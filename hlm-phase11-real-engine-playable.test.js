'use strict';
const assert=require('node:assert/strict');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {createBrowserFranchiseSaveStore}=require('./hlm-phase10-browser-storage');
const {calculateStandings}=require('./hlm-phase10-standings');
const {createBridge,KEY}=require('./hlm-phase11-gameplay-bridge');
const {createSession}=require('./hlm-phase11-playable-session');
function run(){
 const map=new Map(),writes=[];
 const storage={getItem:k=>map.get(k)??null,setItem(k,v){writes.push(k);map.set(k,v)}};
 const teams=[{id:1,name:'Portland'},{id:2,name:'Seattle'},{id:3,name:'Victoria'}];
 const state=createGameStateEnvelope({meta:{saveId:'real-engine-acceptance',currentDate:'2026-10-17',controlledTeamId:1},teams,players:[{id:101,teamId:1,name:'Test Skater',position:'C'}],games:[{id:'g1',date:'2026-10-18',homeTeamId:1,awayTeamId:2,status:'scheduled'},{id:'g2',date:'2026-10-19',homeTeamId:3,awayTeamId:1,status:'scheduled'},{id:'g3',date:'2026-10-20',homeTeamId:1,awayTeamId:3,status:'scheduled'}]});
 const engine={createBrowserFranchiseSaveStore,calculateStandings};
 const bridge=createBridge(engine,storage);
 assert.throws(()=>bridge.importIsolated(state,false),/confirmation/);
 bridge.importIsolated(state,true);
 assert.deepEqual(writes,[KEY]);assert.equal(map.has('hlm-phase10-save'),false);
 const session=createSession(bridge);
 assert.equal(session.inspect().snapshot.rosterAvailability,'present-unverified');
 assert.throws(()=>session.approveOneDay(false,18),/approval/);
 assert.equal(writes.length,1);
 for(let i=0;i<3;i++){
  const snapshot=session.approveOneDay(true,18+i).snapshot;
  assert.equal(snapshot.completedControlledGames,i+1);
  assert.equal(snapshot.scheduledGames,2-i);
  assert.equal(snapshot.asOfDate,'2026-10-'+String(18+i));
  const reloaded=createBridge(engine,storage).playableFranchiseSnapshot();
  assert.equal(reloaded.completedControlledGames,i+1);
  assert.equal(reloaded.standings.reduce((n,t)=>n+t.gp,0),2*(i+1));
 }
 assert.equal(session.inspect().snapshot.simulationAvailable,false);
 assert.throws(()=>session.approveOneDay(true,23),/No scheduled games/);
 assert.equal(writes.length,4);
 assert.ok(writes.every(k=>k===KEY));
 assert.equal(map.has('hlm-phase10-save'),false);
 const before=map.get(KEY);session.cancel();assert.throws(()=>session.approveOneDay(true,24),/cancelled/);assert.equal(map.get(KEY),before);
 return before;
}
assert.equal(run(),run());
console.log('Mission 1312 real Phase 10 engine, browser persistence, controlled schedule, standings, human GM approval and isolation passed');
