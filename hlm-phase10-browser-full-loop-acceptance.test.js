'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const bundle=fs.readFileSync('hlm-phase10-browser.bundle.js','utf8');
const html=fs.readFileSync('phase10-demo.html','utf8');
const sandbox={};sandbox.window=sandbox;
vm.runInNewContext(bundle,sandbox,{timeout:5000});
const api=sandbox.HLMPhase10;
assert.match(html,/id="offseason"/);
const teams=[{id:1,name:'Wolves'},{id:2,name:'Falcons'},{id:3,name:'Bears'},{id:4,name:'Blades'}];
const start='2026-10-12',games=[];
for(let day=1;day<=6;day++){
 const date=api.addCalendarDays(start,day);
 for(const [homeTeamId,awayTeamId] of (day%2?[[1,2],[3,4]]:[[1,3],[2,4]]))games.push({id:'G'+day+'-'+homeTeamId,date,status:'scheduled',homeTeamId,awayTeamId});
}
const map=new Map(),storage={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)};
const store=api.createBrowserFranchiseSaveStore(storage,'acceptance');
store.save(api.createGameStateEnvelope({meta:{saveId:'acceptance',currentDate:start,controlledTeamId:1},teams,games}));
for(let day=1;day<=6;day++){
 const result=store.advanceAndSave(day+100);
 assert.equal(result.results.length,2);
}
let state=store.load();
assert.equal(state.activity.games.filter(g=>g.status==='final').length,12);
state=api.startSeasonPlayoffs(state,4).nextState;
store.save(state);
let playoffGames=0;
while(store.load().extensions.phase10Playoffs.status==='active'){
 state=api.simulateNextPlayoffGame(store.load(),1000+playoffGames++).nextState;
 store.save(state);
 assert.ok(playoffGames<100,'Playoff loop did not finish');
}
assert.ok(store.load().extensions.phase10Playoffs.championTeamId!=null);
state=api.finalizeChampionshipSeason(store.load(),'2026-27').nextState;
store.save(state);
const next=api.completeOffseasonAndStartSeason(store.load(),{nextSeason:{completedSeasonId:'2026-27',nextSeasonId:'2027-28',startDate:'2027-10-01'}});
store.save(next.nextState);
state=store.load();
assert.equal(state.history.seasons.length,1);
assert.equal(state.extensions.phase10CurrentSeasonId,'2027-28');
assert.equal(state.activity.games.filter(g=>g.status==='scheduled').length,12);
assert.equal(state.meta.currentDate,'2027-10-01');
const before=map.get('acceptance');
assert.throws(()=>api.completeOffseasonAndStartSeason(state,{nextSeason:{completedSeasonId:'2026-27',nextSeasonId:'2027-28',startDate:'2028-10-01'}}),/already initialized|unfinished/);
assert.equal(map.get('acceptance'),before);
const advanced=store.advanceAndSave(200);
assert.equal(advanced.toDate,'2027-10-02');
assert.equal(store.load().history.seasons.length,1);
assert.equal(store.load().activity.games.filter(g=>g.status==='final').length,2);
console.log('Phase 10 browser full season, playoffs, rollover, reload, and resumed play passed');
