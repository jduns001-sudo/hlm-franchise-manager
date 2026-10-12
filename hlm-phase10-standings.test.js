'use strict';
const assert=require('node:assert/strict');
const {calculateStandings}=require('./hlm-phase10-standings');
const teams=[{id:1,name:'A'},{id:2,name:'B'},{id:3,name:'C'}];
const games=[
  {id:'1',status:'final',homeTeamId:1,awayTeamId:2,homeGoals:4,awayGoals:2,overtime:false},
  {id:'2',status:'final',homeTeamId:2,awayTeamId:3,homeGoals:3,awayGoals:2,overtime:true},
  {id:'3',status:'scheduled',homeTeamId:1,awayTeamId:3}
];
const before=JSON.stringify({teams,games});
const rows=calculateStandings(teams,games);
const a=rows.find(r=>r.teamId===1),b=rows.find(r=>r.teamId===2),c=rows.find(r=>r.teamId===3);
assert.deepEqual([a.gp,a.w,a.l,a.otl,a.points,a.gf,a.ga],[1,1,0,0,2,4,2]);
assert.deepEqual([b.gp,b.w,b.l,b.otl,b.points,b.gf,b.ga],[2,1,1,0,2,5,6]);
assert.deepEqual([c.gp,c.w,c.l,c.otl,c.points,c.gf,c.ga],[1,0,0,1,1,2,3]);
assert.equal(JSON.stringify({teams,games}),before);
assert.deepEqual(calculateStandings(teams,games),rows);
assert.throws(()=>calculateStandings(teams,[games[0],games[0]]),/Duplicate final game/);
assert.throws(()=>calculateStandings(teams,[{...games[0],homeGoals:2,awayGoals:2}]),/non-tied/);
assert.throws(()=>calculateStandings(teams,[{...games[0],awayTeamId:999}]),/invalid teams/);
assert.throws(()=>calculateStandings([{id:1},{id:1}],[]),/Duplicate team/);
console.log('Phase 10 standings projection tests passed');
