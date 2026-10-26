'use strict';
const assert=require('node:assert/strict');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {applyScheduledGame}=require('./hlm-phase10-apply-game');
const {calculateStandings}=require('./hlm-phase10-standings');
const {simulateNextDay}=require('./hlm-phase10-simulate-day');
const {createBrowserFranchiseSaveStore}=require('./hlm-phase10-browser-storage');
const {create,KEY}=require('./hlm-phase11-isolated-single-game');
const memory=new Map([['hlm_front_office_v8','M1619_PRODUCTION_SENTINEL']]);
const storage={getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,String(v))};
const engine={applyScheduledGame,calculateStandings,simulateNextDay,createBrowserFranchiseSaveStore};
const games=[
{id:'cpu-1',date:'2026-10-19',homeTeamId:2,awayTeamId:3,status:'scheduled'},
{id:'gm-1',date:'2026-10-20',homeTeamId:1,awayTeamId:2,status:'scheduled'},
{id:'cpu-2',date:'2026-10-21',homeTeamId:3,awayTeamId:2,status:'scheduled'}
];
const initial=createGameStateEnvelope({meta:{controlledTeamId:1,currentDate:'2026-10-18'},teams:[{id:1,name:'GM'},{id:2,name:'CPU A'},{id:3,name:'CPU B'}],games});
const manager=create(engine,storage);manager.stage(initial,true);
const key=KEY,baseline=storage.getItem(key),stale=create(engine,storage);
assert.throws(()=>manager.advanceNextDay(1619,false),/approval/);
assert.equal(storage.getItem(key),baseline,'declined approval must not save');
const first=manager.advanceNextDay(1619,true);
assert.equal(first.state.activity.games.filter(g=>g.id==='cpu-1'&&g.status==='final').length,1);
const authoritative=first.state.activity.games.find(g=>g.id==='cpu-1');
assert.ok(Number.isFinite(authoritative.homeGoals)&&Number.isFinite(authoritative.awayGoals),'authoritative CPU score');
const firstSave=storage.getItem(key);
assert.throws(()=>stale.advanceNextDay(1620,true),/changed|reload/i);
assert.equal(storage.getItem(key),firstSave,'stale tab must not overwrite');
const reloaded=create(engine,storage);reloaded.load();
const second=reloaded.advanceNextDay(1620,true);
assert.deepEqual(second.state.activity.games.find(g=>g.id==='cpu-1'),authoritative,'final immutable after next day');
const nextSave=storage.getItem(key);
assert.throws(()=>reloaded.advanceNextDay(1621,false),/approval/);
assert.equal(storage.getItem(key),nextSave,'decline remains no-save');
const again=create(engine,storage);again.load();
const third=again.advanceNextDay(1621,true);
assert.deepEqual(third.state.activity.games.find(g=>g.id==='cpu-1'),authoritative,'historical final survives further day');
assert.equal(third.state.activity.games.filter(g=>g.id==='cpu-1').length,1,'exactly one source game ID');
assert.equal(third.state.activity.games.filter(g=>g.id==='cpu-2'&&g.status==='final').length,1);
assert.equal(storage.getItem('hlm_front_office_v8'),'M1619_PRODUCTION_SENTINEL');
console.log('Mission 1619 deterministic CPU fixture final once, guarded approvals, stale-write, reload, later-day continuity, production isolation PASS');
