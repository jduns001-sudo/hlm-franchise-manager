'use strict';
const assert=require('node:assert/strict');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {auditPlayableLoop}=require('./hlm-phase11-playable-loop-readiness');
const state=createGameStateEnvelope({
 meta:{saveId:'playable-loop-test',controlledTeamId:1,currentDate:'2026-10-17'},
 teams:[{id:1,name:'Owner'},{id:2,name:'CPU'}],
 players:[{id:10,teamId:1},{id:20,teamId:2}],
 games:[{id:'G1',status:'scheduled',homeTeamId:1,awayTeamId:2}]
});
const original=JSON.stringify(state);
const pass=auditPlayableLoop(state);
assert.equal(pass.ready,true,JSON.stringify(pass.issues));
assert.equal(pass.snapshot.scheduledTeams,2);
assert.equal(JSON.stringify(state),original);
const cases=[
 [s=>s.meta.controlledTeamId=99,'CONTROLLED_TEAM_NOT_FOUND'],
 [s=>s.meta.currentDate='2026-02-30','INVALID_CURRENT_DATE'],
 [s=>s.activity.games=[],'NO_SEASON_SCHEDULE'],
 [s=>s.universe.teams.push({id:3,name:'Unscheduled'}),'TEAM_WITHOUT_GAMES'],
 [s=>s.activity.games[0].awayTeamId=1,'INVALID_GAME_TEAMS']
];
for(const [change,code] of cases){
 const copy=JSON.parse(original);change(copy);
 const result=auditPlayableLoop(copy);
 assert.equal(result.ready,false,code);
 assert(result.issues.some(x=>x.code===code),code);
}
assert.equal(auditPlayableLoop(null).ready,false);
assert.equal(JSON.stringify(state),original);
console.log('Read-only playable loop readiness acceptance passed');
