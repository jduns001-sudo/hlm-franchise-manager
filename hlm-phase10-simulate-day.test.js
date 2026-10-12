'use strict';
const assert=require('node:assert/strict');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {simulateNextDay}=require('./hlm-phase10-simulate-day');
const state=createGameStateEnvelope({
  meta:{saveId:'day',currentDate:'2026-10-12',controlledTeamId:1},
  teams:[{id:1,name:'A'},{id:2,name:'B'}],
  games:[
    {id:'today',status:'scheduled',date:'2026-10-12',homeTeamId:1,awayTeamId:2},
    {id:'tomorrow',status:'scheduled',date:'2026-10-13',homeTeamId:1,awayTeamId:2},
    {id:'future',status:'scheduled',date:'2026-10-14',homeTeamId:2,awayTeamId:1}
  ]
});
const before=JSON.stringify(state);
const first=simulateNextDay(state,17);
assert.equal(first.toDate,'2026-10-13');
assert.equal(first.results.length,1);
assert.equal(first.results[0].gameId,'tomorrow');
assert.equal(first.standings.reduce((sum,row)=>sum+row.gp,0),2);
assert.equal(JSON.stringify(state),before);
assert.deepEqual(simulateNextDay(state,17),first);
const second=simulateNextDay(first.nextState,17);
assert.equal(second.toDate,'2026-10-14');
assert.equal(second.results.length,1);
assert.equal(second.standings.reduce((sum,row)=>sum+row.gp,0),4);
assert.equal(second.nextState.activity.games[0].status,'scheduled');
assert.throws(()=>simulateNextDay(state,-1),/Seed/);
const duplicate=JSON.parse(before);
duplicate.activity.games.push({...duplicate.activity.games[1]});
assert.throws(()=>simulateNextDay(duplicate,17),/Duplicate/);
console.log('Phase 10 daily simulation workflow tests passed');
