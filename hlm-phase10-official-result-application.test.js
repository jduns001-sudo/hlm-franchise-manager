'use strict';
const assert = require('node:assert/strict');
const { createGameStateEnvelope } = require('./hlm-game-state');
const { applyValidatedOfficialGameResult: apply } = require('./hlm-phase10-official-result-application');
const state = createGameStateEnvelope({
  teams:[{id:1,name:'Home'},{id:2,name:'Away'}],
  games:[{id:'G1',status:'scheduled',homeTeamId:1,awayTeamId:2}]
});
const result = {gameId:'G1',status:'final',official:true,homeTeamId:1,awayTeamId:2,
  homeGoals:3,awayGoals:2,overtime:true,winnerTeamId:1};
const auth = {kind:'trusted-official-game-authorization',issuer:'phase10-trusted-game-engine',validated:true,gameId:'G1'};
const before=JSON.stringify(state);
assert.throws(()=>apply(state,result,null),{code:'OFFICIAL_RESULT_NOT_AUTHORIZED'});
assert.throws(()=>apply(state,result,{...auth,issuer:'external'}),{code:'OFFICIAL_RESULT_NOT_AUTHORIZED'});
const a=apply(state,result,auth);
assert.equal(a.nextState.activity.games[0].status,'final');
assert.equal(a.standings[0].teamId,1);
assert.equal(a.standings[0].points,2);
assert.equal(a.standings[1].points,1);
assert.equal(JSON.stringify(state),before);
assert.throws(()=>apply(a.nextState,result,auth),{code:'OFFICIAL_GAME_SCHEDULE_MISMATCH'});
assert.throws(()=>apply(state,{...result,winnerTeamId:2},auth),{code:'INVALID_OFFICIAL_GAME_WINNER'});
assert.throws(()=>apply(state,{...result,homeGoals:2,awayGoals:2},auth),{code:'INVALID_OFFICIAL_FINAL_RESULT'});
console.log('Mission 740 official result application tests passed.');
