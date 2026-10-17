'use strict';
const assert=require('node:assert/strict');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {evaluate}=require('./hlm-phase11-gameplay-readiness');
const state=createGameStateEnvelope({meta:{saveId:'real',controlledTeamId:1,currentDate:'2026-10-17'},teams:[{id:1,name:'GM'},{id:2,name:'CPU'}],players:[{id:10,teamId:1},{id:20,teamId:2}],contracts:[{id:31,playerId:10},{id:32,playerId:20}],games:[{id:'G1',date:'2026-10-18',status:'scheduled',homeTeamId:1,awayTeamId:2}]});
const original=JSON.stringify(state);
const good=evaluate(state);assert.equal(good.ready,true);assert.equal(good.blockerCount,0);assert.equal(good.gmApprovalStillRequired,true);assert.equal(good.productionActivationAllowed,false);
const cases=[[s=>s.universe.players[0].teamId=999,'UNKNOWN_PLAYER_TEAM'],[s=>s.assets.contracts[0].playerId=999,'ORPHAN_CONTRACT'],[s=>s.activity.games=[],'SCHEDULE_MISSING'],[s=>s.meta.controlledTeamId=999,'CONTROLLED_TEAM_MISSING'],[s=>s.activity.games[0].awayTeamId=1,'INVALID_GAME_TEAMS'],[s=>s.universe.players.push({...s.universe.players[0]}),'INVALID_PLAYER_IDENTITY']];
for(const [change,code] of cases){const copy=JSON.parse(original);change(copy);const report=evaluate(copy);assert.equal(report.ready,false,code);assert.ok(report.issues.some(i=>i.code===code),code);}
const warning=JSON.parse(original);warning.assets.contracts=[];const result=evaluate(warning);assert.equal(result.ready,true);assert.ok(result.warningCount>0);
assert.equal(JSON.stringify(state),original);console.log('Mission 1210 deterministic readiness validation passed');
