'use strict';
const assert=require('node:assert/strict');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {generateRoundRobinSchedule}=require('./hlm-phase10-season-schedule');
const {preview}=require('./hlm-phase11-long-season-preview');
function fixture(count){const teams=Array.from({length:count},(_,i)=>({id:i+1,name:'Club '+(i+1)})),players=teams.map(t=>({id:t.id+1000,teamId:t.id}));return createGameStateEnvelope({meta:{saveId:'isolated-long-season',controlledTeamId:1,currentDate:'2026-10-17'},teams,players,games:generateRoundRobinSchedule(teams,'2026-10-17',2)})}
for(const n of [4,8,16,30]){
 const state=fixture(n),raw=JSON.stringify(state);
 assert.throws(()=>preview(state,120,false),/GM approval/);
 const result=preview(state,120,true);
 assert.equal(result.teamCount,n);assert.equal(result.scheduledGames,n*(n-1));assert.equal(result.completedGames,n*(n-1));assert.equal(result.simulatedGames,n*(n-1));assert.equal(result.controlledTeamResults.length,2*(n-1));assert.equal(result.controlledTeamStandings.gp,2*(n-1));assert.equal(result.standings.reduce((sum,t)=>sum+t.gp,0),2*result.completedGames);assert.equal(result.standingsIntegrity,true);assert.equal(result.productionActivationAllowed,false);assert.equal(result.persistencePerformed,false);assert.equal(result.dates.length,120);assert.deepEqual(preview(state,120,true),result);assert.equal(JSON.stringify(state),raw);
}
console.log('Mission 1213 deterministic 4/8/16/30-team season integrity and save isolation passed');
