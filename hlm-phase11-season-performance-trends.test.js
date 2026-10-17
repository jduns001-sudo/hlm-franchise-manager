'use strict';
const assert=require('node:assert/strict');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {generateRoundRobinSchedule}=require('./hlm-phase10-season-schedule');
const {analyze,summarize}=require('./hlm-phase11-season-performance-trends');
function fixture(n){const teams=Array.from({length:n},(_,i)=>({id:i+1,name:'Club '+(i+1)})),players=teams.map(t=>({id:t.id+1000,teamId:t.id}));return createGameStateEnvelope({meta:{saveId:'isolated-trends',controlledTeamId:1,currentDate:'2026-10-17'},teams,players,games:generateRoundRobinSchedule(teams,'2026-10-17',2)})}
for(const n of [4,8,16,30]){
 const state=fixture(n),raw=JSON.stringify(state);assert.throws(()=>analyze(state,120,false),/GM approval/);
 const r=analyze(state,120,true);assert.equal(r.teamCount,n);assert.equal(r.games,2*(n-1));assert.equal(r.record.wins+r.record.losses+r.record.ties,r.games);assert.equal(r.record.goalsFor-r.record.goalsAgainst,r.record.goalDifferential);assert.equal(r.standingsMovement.length,120);assert.equal(r.productionActivationAllowed,false);assert.equal(r.persistencePerformed,false);assert.equal(r.gmApprovalStillRequired,true);assert.deepEqual(analyze(state,120,true),r);assert.equal(JSON.stringify(state),raw);
 assert.equal(r.streaks.runs.reduce((sum,run)=>sum+run.length,0),r.games);for(const s of r.standingsMovement)assert.ok(Number.isFinite(s.goalDifferential));
}
const empty=summarize({kind:'experimental-season-progression-evidence',standingsIntegrity:true,controlledTeamGames:[],standingsSnapshots:[{date:'2026-10-18',completedGames:0,leagueGamesPlayed:0,leagueGoalsFor:0,leagueGoalsAgainst:0,controlledTeam:{gp:0,gf:0,ga:0,points:0}}]});assert.equal(empty.recentForm.confidence,'insufficient');assert.equal(empty.recentForm.direction,'insufficient-comparison');
console.log('Mission 1215 deterministic 4/8/16/30-team trends, confidence and save isolation passed');
