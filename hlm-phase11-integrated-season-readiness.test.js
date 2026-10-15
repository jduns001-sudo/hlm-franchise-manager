'use strict';
const assert=require('node:assert/strict');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {auditIntegratedSeason}=require('./hlm-phase11-integrated-season-readiness');
const seed=createGameStateEnvelope({
 meta:{saveId:'season-integration',controlledTeamId:1,currentDate:'2026-10-12'},
 teams:[{id:1,name:'Owner'},{id:2,name:'CPU'}],
 players:[{id:10,teamId:1},{id:20,teamId:2}],
 games:[{id:'G1',status:'scheduled',homeTeamId:1,awayTeamId:2}]
});
const original=JSON.stringify(seed);
const ready=auditIntegratedSeason(seed);
assert.equal(ready.ready,true);
assert.equal(ready.snapshot.teamCount,2);
assert.equal(ready.snapshot.scheduledGames,1);
assert.equal(ready.snapshot.financeSnapshotMissing,2);
assert.equal(JSON.stringify(seed),original);
assert.equal(auditIntegratedSeason(null).ready,false);
for(const [mutate,code] of [
 [s=>s.universe.teams.push({id:1,name:'Duplicate'}),'INVALID_OR_DUPLICATE_TEAM_ID'],
 [s=>s.universe.players.push({id:10,teamId:1}),'INVALID_OR_DUPLICATE_PLAYER_ID'],
 [s=>s.universe.players[0].teamId=99,'PLAYER_TEAM_NOT_FOUND'],
 [s=>s.activity.games.push({...s.activity.games[0]}),'INVALID_OR_DUPLICATE_GAME_ID'],
 [s=>s.activity.games[0].awayTeamId=99,'INVALID_GAME_TEAMS'],
 [s=>s.activity.games[0].awayTeamId=1,'INVALID_GAME_TEAMS']
]){
 const state=JSON.parse(original);mutate(state);
 const result=auditIntegratedSeason(state);
 assert.equal(result.ready,false,code);
 assert(result.issues.some(issue=>issue.code===code),code);
 assert.equal(JSON.stringify(seed),original);
}
const withFinance=JSON.parse(original);
withFinance.finances={teamSnapshots:{'1':{ownerBudget:90000000},'2':{ownerBudget:90000000}}};
const covered=auditIntegratedSeason(withFinance);
assert.equal(covered.snapshot.financeSnapshotTeams,2);
assert.equal(covered.snapshot.financeSnapshotMissing,0);
assert.equal(covered.ready,true);
console.log('Phase 11 integrated season readiness, owner/CPU references and nonmutation passed');
