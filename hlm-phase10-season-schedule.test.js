'use strict';
const assert=require('node:assert/strict');
const {generateRoundRobinSchedule}=require('./hlm-phase10-season-schedule');
for(const count of [2,3,4,5,6]){
 const teams=Array.from({length:count},(_,i)=>({id:i+1}));
 const games=generateRoundRobinSchedule(teams,'2026-10-12',2);
 assert.equal(games.length,count*(count-1));
 assert.equal(new Set(games.map(g=>g.id)).size,games.length);
 const pairs=new Map();
 for(const game of games){
  assert.notEqual(game.homeTeamId,game.awayTeamId);
  assert.match(game.date,/^2026-10-/);
  const pair=[game.homeTeamId,game.awayTeamId].sort((a,b)=>a-b).join('-');
  pairs.set(pair,(pairs.get(pair)||0)+1);
 }
 assert.equal(pairs.size,count*(count-1)/2);
 assert.ok([...pairs.values()].every(n=>n===2));
 assert.deepEqual(generateRoundRobinSchedule(teams,'2026-10-12',2),games);
}
assert.throws(()=>generateRoundRobinSchedule([{id:1},{id:1}],'2026-10-12'),/unique/);
assert.throws(()=>generateRoundRobinSchedule([{id:1},{id:2}],'2026-02-30'),/date/);
console.log('Phase 10 season schedule tests passed');
