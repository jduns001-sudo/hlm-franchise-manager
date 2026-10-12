'use strict';
const assert = require('node:assert/strict');
const {simulateGameScore} = require('./hlm-phase10-game-simulator');
const input={gameId:'G1',homeTeamId:1,awayTeamId:2,seed:42};
const original=JSON.stringify(input);
const result=simulateGameScore(input);
assert.deepEqual(simulateGameScore(input),result,'same seed must replay same game');
assert.equal(JSON.stringify(input),original,'simulator must not mutate input');
assert.equal(result.status,'final');
assert.ok(result.homeGoals >= 0 && result.awayGoals >= 0);
assert.notEqual(result.homeGoals,result.awayGoals,'all games must have a winner');
assert.ok([1,2].includes(result.winnerTeamId));
assert.equal(Object.isFrozen(result),true);
for(let seed=0;seed<250;seed++){
  const game=simulateGameScore({...input,seed});
  assert.notEqual(game.homeGoals,game.awayGoals);
  assert.equal(game.overtime,game.homeGoals+game.awayGoals > 0 && Math.abs(game.homeGoals-game.awayGoals)===1 && game.overtime);
}
for(const invalid of [null,{}, {...input,homeTeamId:2}, {...input,seed:-1}, {...input,seed:1.5}]){
  assert.throws(()=>simulateGameScore(invalid));
}
console.log('Phase 10 deterministic score simulator tests passed');
