'use strict';
const assert=require('node:assert/strict');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {applyScheduledGame}=require('./hlm-phase10-apply-game');
const state=createGameStateEnvelope({
  meta:{saveId:'demo',currentDate:'2026-10-12',controlledTeamId:1},
  teams:[{id:1,name:'Home'},{id:2,name:'Away'}],
  games:[{id:'G1',status:'scheduled',date:'2026-10-12',homeTeamId:1,awayTeamId:2}]
});
const before=JSON.stringify(state);
const a=applyScheduledGame(state,'G1',42);
assert.equal(JSON.stringify(state),before);
assert.equal(a.nextState.activity.games[0].status,'final');
assert.notEqual(a.result.homeGoals,a.result.awayGoals);
assert.deepEqual(applyScheduledGame(state,'G1',42),a);
assert.throws(()=>applyScheduledGame(a.nextState,'G1',42),/already played/);
assert.throws(()=>applyScheduledGame(state,'missing',42),/exactly once/);
assert.throws(()=>applyScheduledGame(state,'G1',-1),/Invalid game/);
const invalid=JSON.parse(before);
invalid.activity.games[0].awayTeamId=999;
assert.throws(()=>applyScheduledGame(invalid,'G1',42),/unknown team/);
const duplicate=JSON.parse(before);
duplicate.activity.games.push({...duplicate.activity.games[0]});
assert.throws(()=>applyScheduledGame(duplicate,'G1',42),/exactly once/);
console.log('Phase 10 scheduled game application tests passed');
