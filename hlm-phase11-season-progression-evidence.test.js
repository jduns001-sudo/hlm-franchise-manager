'use strict';
const assert=require('node:assert/strict');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {generateRoundRobinSchedule}=require('./hlm-phase10-season-schedule');
const {analyze}=require('./hlm-phase11-season-progression-evidence');
function fixture(n){const teams=Array.from({length:n},(_,i)=>({id:i+1,name:'Club '+(i+1)})),players=teams.map(t=>({id:t.id+1000,teamId:t.id}));return createGameStateEnvelope({meta:{saveId:'isolated-season-evidence',controlledTeamId:1,currentDate:'2026-10-17'},teams,players,games:generateRoundRobinSchedule(teams,'2026-10-17',2)})}
for(const n of [4,8,16,30]){
 const state=fixture(n),before=JSON.stringify(state);assert.throws(()=>analyze(state,120,false),/GM approval/);
 const report=analyze(state,120,true);
 assert.equal(report.teamCount,n);assert.equal(report.scheduledGames,n*(n-1));assert.equal(report.completedGames,n*(n-1));assert.equal(report.controlledTeamGames.length,2*(n-1));assert.equal(report.finalControlledTeamStandings.gp,2*(n-1));assert.equal(report.standingsSnapshots.length,120);assert.equal(report.standingsSnapshots.at(-1).leagueGamesPlayed,2*n*(n-1));assert.equal(report.standingsIntegrity,true);assert.equal(report.productionActivationAllowed,false);assert.equal(report.persistencePerformed,false);assert.deepEqual(analyze(state,120,true),report);assert.equal(JSON.stringify(state),before);
 for(const g of report.controlledTeamGames)assert.ok(['win','loss','tie'].includes(g.outcome));
 for(const s of report.standingsSnapshots)assert.equal(s.leagueGoalsFor,s.leagueGoalsAgainst);
}
console.log('Mission 1214 deterministic 4/8/16/30-team progression, standings and save isolation passed');
