'use strict';
const assert=require('node:assert/strict');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {createExperimentalRosterSaveStore:createStore}=require('./hlm-phase10-roster-save-store');
const values=new Map([['hlm-phase10-demo-v1','ORIGINAL_FRONT_OFFICE_DATA']]);
const adapter={read:key=>values.get(key)??null,write:(key,value)=>values.set(key,value)};
const store=createStore(adapter);
const positions=['C','LW','RW','D','D','G'];
const players=[1,2].flatMap(teamId=>positions.map((position,i)=>({id:teamId*100+i,teamId,position,ovr:80})));
const contracts=players.map(p=>({playerId:p.id,teamId:p.teamId,status:'Active'}));
const injuries=players.map(p=>({playerId:p.id,status:'Recovered'}));
const state=createGameStateEnvelope({meta:{currentDate:'2026-10-13'},
 teams:[{id:1,name:'A'},{id:2,name:'B'}],players,contracts,injuries,
 games:[{id:'G1',date:'2026-10-14',status:'scheduled',homeTeamId:1,awayTeamId:2}]});
store.save(state);
const result=store.advanceAndSave(12);
assert.equal(result.saved,true);
assert.equal(store.load().activity.games[0].status,'final');
assert.equal(store.load().meta.currentDate,'2026-10-14');
assert.equal(values.get('hlm-phase10-demo-v1'),'ORIGINAL_FRONT_OFFICE_DATA');
assert.throws(()=>createStore(adapter,'hlm-phase10-demo-v1'),{code:'INVALID_ROSTER_EXPERIMENTAL_SAVE_KEY'});
const blockedStore=createStore(adapter,'hlm-phase10-roster-experimental-blocked');
store.save(state);
const blocked=createGameStateEnvelope({...{
 meta:{currentDate:'2026-10-13'},teams:[{id:1,name:'A'},{id:2,name:'B'}],players,contracts:[],injuries,
 games:[{id:'G1',date:'2026-10-14',status:'scheduled',homeTeamId:1,awayTeamId:2}]
}});
blockedStore.save(blocked);
const before=JSON.stringify(blockedStore.load());
const denied=blockedStore.advanceAndSave(12);
assert.equal(denied.saved,false);
assert.equal(denied.advanced,false);
assert.equal(JSON.stringify(blockedStore.load()),before);
console.log('Mission 744 isolated roster save store tests passed.');
