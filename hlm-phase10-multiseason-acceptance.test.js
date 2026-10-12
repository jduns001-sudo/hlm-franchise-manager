'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const sandbox={};sandbox.window=sandbox;
vm.runInNewContext(fs.readFileSync('hlm-phase10-browser.bundle.js','utf8'),sandbox,{timeout:5000});
const api=sandbox.HLMPhase10;
const teams=[{id:1,name:'A'},{id:2,name:'B'},{id:3,name:'C'},{id:4,name:'D'}];
const initial='2026-10-01';
const games=[];
for(let day=1;day<=4;day++){
 const date=api.addCalendarDays(initial,day);
 for(const [homeTeamId,awayTeamId] of [[1,2],[3,4]])games.push({id:'g'+day+'-'+homeTeamId,date,status:'scheduled',homeTeamId,awayTeamId});
}
const data=new Map(),storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
const store=api.createBrowserFranchiseSaveStore(storage,'two-season');
store.save(api.createGameStateEnvelope({meta:{saveId:'two-season',controlledTeamId:1,currentDate:initial},teams,games}));
for(let season=0;season<2;season++){
 let state=store.load();
 let day=0;
 while(state.activity.games.some(g=>g.status==='scheduled')){
   assert.ok(day++<30,'Regular season stalled');
   state=store.advanceAndSave(10000+season*100+day).nextState;
 }
 state=api.startSeasonPlayoffs(state,4).nextState;store.save(state);
 let count=0;
 while(store.load().extensions.phase10Playoffs.status==='active'){
   assert.ok(count++<100,'Playoffs stalled');
   state=api.simulateNextPlayoffGame(store.load(),20000+season*100+count).nextState;
   store.save(state);
 }
 const prior=(2026+season)+'-'+String(2027+season).slice(-2);
 state=api.finalizeChampionshipSeason(store.load(),prior).nextState;
 store.save(state);
 assert.equal(store.load().history.seasons.length,season+1);
 const next=(2027+season)+'-'+String(2028+season).slice(-2);
 state=api.completeOffseasonAndStartSeason(store.load(),{nextSeason:{completedSeasonId:prior,nextSeasonId:next,startDate:(2027+season)+'-10-01'}}).nextState;
 store.save(state);
 assert.equal(store.load().extensions.phase10CurrentSeasonId,next);
 assert.equal(store.load().history.seasons.length,season+1);
 assert.ok(store.load().activity.games.some(g=>g.status==='scheduled'));
}
assert.equal(store.load().history.seasons.length,2);
assert.equal(store.load().extensions.phase10CurrentSeasonId,'2028-29');
console.log('Phase 10 multi-season browser acceptance passed');
