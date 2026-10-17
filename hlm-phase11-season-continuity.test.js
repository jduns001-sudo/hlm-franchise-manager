'use strict';
const assert=require('node:assert/strict');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {generateRoundRobinSchedule}=require('./hlm-phase10-season-schedule');
const {validate,simulatePreview}=require('./hlm-phase11-season-continuity');
const teams=[{id:1,name:'GM'},{id:2,name:'CPU'}],date='2026-10-17';
const state=createGameStateEnvelope({meta:{saveId:'isolated-test',controlledTeamId:1,currentDate:date},teams,players:[{id:10,teamId:1},{id:20,teamId:2}],games:generateRoundRobinSchedule(teams,date,2)});
const raw=JSON.stringify(state);assert.equal(validate(state).balanced,true);
assert.throws(()=>simulatePreview(state,7,false),/approval/);
const result=simulatePreview(state,7,true);assert.equal(result.days,7);assert.equal(result.controlledTeamId,1);assert.equal(result.completedGames,2);assert.equal(result.standings.reduce((n,t)=>n+t.gp,0),4);assert.equal(result.productionActivationAllowed,false);assert.equal(result.persistencePerformed,false);
assert.deepEqual(simulatePreview(state,7,true),result);assert.equal(JSON.stringify(state),raw);
const changes=[[s=>s.activity.games[1].homeTeamId=1,'mapping'],[s=>s.activity.games.reverse(),'chronology'],[s=>s.activity.games[1].date=s.activity.games[0].date,'home/away'],[s=>s.meta.controlledTeamId=99,'Controlled team']];
for(const [change,message] of changes){const copy=JSON.parse(raw);change(copy);assert.throws(()=>validate(copy),undefined,message);}
console.log('Mission 1212 season validation, standings and multiday continuity passed');
