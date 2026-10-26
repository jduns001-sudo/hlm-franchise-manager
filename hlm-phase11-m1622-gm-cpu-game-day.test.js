'use strict';
const assert=require('node:assert/strict');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {applyScheduledGame}=require('./hlm-phase10-apply-game');
const {calculateStandings}=require('./hlm-phase10-standings');
const {simulateNextDay}=require('./hlm-phase10-simulate-day');
const {createBrowserFranchiseSaveStore}=require('./hlm-phase10-browser-storage');
const {create,KEY}=require('./hlm-phase11-isolated-single-game');
const {project}=require('./hlm-phase11-m1620-cpu-fixture-history');
const memory=new Map([['hlm_front_office_v8','M1622_PRODUCTION_SENTINEL']]);
const storage={getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,String(v))};
const engine={applyScheduledGame,calculateStandings,simulateNextDay,createBrowserFranchiseSaveStore};
const teams=[{id:1,name:'GM'},{id:2,name:'CPU North'},{id:3,name:'CPU South'},{id:4,name:'CPU West'}];
const games=[
 {id:'gm-1',date:'2026-10-19',homeTeamId:1,awayTeamId:2,status:'scheduled'},
 {id:'cpu-1',date:'2026-10-19',homeTeamId:3,awayTeamId:4,status:'scheduled'},
 {id:'gm-2',date:'2026-10-20',homeTeamId:2,awayTeamId:1,status:'scheduled'},
 {id:'cpu-2',date:'2026-10-20',homeTeamId:4,awayTeamId:3,status:'scheduled'}
];
const state=createGameStateEnvelope({meta:{controlledTeamId:1,currentDate:'2026-10-18'},teams,games});
const manager=create(engine,storage);manager.stage(state,true);
const stale=create(engine,storage);
const before=storage.getItem(KEY);
assert.throws(()=>manager.advanceNextDay(1622,false),/approval/i);
assert.equal(storage.getItem(KEY),before,'declined day is no-save');
const first=manager.advanceNextDay(1622,true);
const persisted=manager.peek();
const pair=['gm-1','cpu-1'].map(id=>persisted.activity.games.find(g=>g.id===id));
assert.ok(pair.every(g=>g?.status==='final'),'GM and CPU games finalized in one approved day');
assert.equal(persisted.activity.games.filter(g=>['gm-1','cpu-1'].includes(g.id)).length,2,'no duplicate finals');
assert.deepEqual(first.standings,calculateStandings(persisted.universe.teams,persisted.activity.games),'standings match saved authoritative games');
const rows=project(persisted);
assert.equal(rows.filter(x=>x.id==='cpu-1').length,1,'CPU history contains authoritative final once');
assert.equal(rows.find(x=>x.id==='cpu-1').homeGoals,pair[1].homeGoals);
assert.equal(rows.find(x=>x.id==='cpu-1').awayGoals,pair[1].awayGoals);
assert.equal(rows.some(x=>x.id==='gm-1'),false,'CPU history must not mislabel GM final');
const saved=storage.getItem(KEY);
assert.throws(()=>stale.advanceNextDay(1623,true),/changed|reload/i);
assert.equal(storage.getItem(KEY),saved,'stale tab cannot overwrite authoritative finals');
const reloaded=create(engine,storage);reloaded.load();
assert.deepEqual(reloaded.peek().activity.games.filter(g=>g.status==='final'),pair,'reload preserves both finals');
assert.throws(()=>reloaded.advanceNextDay(1623,false),/approval/i);
assert.equal(storage.getItem(KEY),saved,'decline after reload no-save');
const second=reloaded.advanceNextDay(1623,true);
for(const final of pair)assert.deepEqual(second.state.activity.games.find(g=>g.id===final.id),final,'subsequent day cannot rewrite prior final');
assert.equal(project(second.state).find(x=>x.id==='cpu-1').homeGoals,pair[1].homeGoals);
assert.deepEqual(second.standings,calculateStandings(second.state.universe.teams,second.state.activity.games));
assert.equal(second.state.activity.games.filter(g=>g.status==='final').length,4,'second day finalizes GM and CPU fixtures');
assert.equal(storage.getItem('hlm_front_office_v8'),'M1622_PRODUCTION_SENTINEL');
console.log('Mission 1622 deterministic GM/CPU authoritative finals, standings, visible history, reload, stale guard, decline and production isolation PASS');
