'use strict';
const assert=require('node:assert/strict');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {startSeasonPlayoffs}=require('./hlm-phase10-season-playoffs');
const {simulateNextPlayoffGame}=require('./hlm-phase10-playoff-simulation');
const teams=[1,2,3,4].map(id=>({id,name:'Team '+id}));
const games=[{id:'R1',status:'final',homeTeamId:1,awayTeamId:2,homeGoals:3,awayGoals:1,overtime:false},{id:'R2',status:'final',homeTeamId:3,awayTeamId:4,homeGoals:2,awayGoals:1,overtime:false}];
const state=startSeasonPlayoffs(createGameStateEnvelope({meta:{saveId:'demo',currentDate:'2026-10-14',controlledTeamId:1},teams,games}),4).nextState;
const first=simulateNextPlayoffGame(state,42);
assert.equal(first.result.status,'final');
assert.equal(first.roundIndex,0);
assert.equal(first.bracket.rounds[0][0].games.length,1);
assert.equal(state.extensions.phase10Playoffs.rounds[0][0].games.length,0);
assert.deepEqual(simulateNextPlayoffGame(state,42),first);
let current=state;
let played=0;
while(current.extensions.phase10Playoffs.status==='active'){
 current=simulateNextPlayoffGame(current,played+1).nextState;
 if(++played>100)throw new Error('Playoff simulation did not terminate');
}
assert.equal(current.extensions.phase10Playoffs.rounds.length,2);
assert.ok(teams.some(t=>t.id===current.extensions.phase10Playoffs.championTeamId));
assert.throws(()=>simulateNextPlayoffGame(current,1),/No active/);
assert.throws(()=>simulateNextPlayoffGame(state,-1),/seed/);
console.log('Phase 10 playoff simulation tests passed');
