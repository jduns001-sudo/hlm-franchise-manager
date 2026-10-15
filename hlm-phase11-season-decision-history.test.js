'use strict';
const assert=require('node:assert/strict');
const {projectSeason}=require('./hlm-phase11-season-decision-history');
const state={meta:{controlledTeamId:1,currentDate:'2026-10-14'},activity:{games:[
 {id:'g1',date:'2026-10-13',status:'final',homeTeamId:1,awayTeamId:2,homeGoals:3,awayGoals:1},
 {id:'g2',date:'2026-10-14',status:'final',homeTeamId:2,awayTeamId:1,homeGoals:2,awayGoals:4},
 {id:'g3',date:'2026-10-15',status:'scheduled',homeTeamId:1,awayTeamId:2}
]}};
const before=JSON.stringify(state);
const result=projectSeason(state);
assert.equal(result.history.length,2);
assert.equal(result.schedule.length,1);
assert.deepEqual(result.standings.map(t=>[t.teamId,t.gp,t.points]),[['1',2,4],['2',2,0]]);
assert.equal(result.decisions[0].gameId,'g3');
assert.equal(result.decisions[0].requiresGMApproval,true);
assert.equal(result.productionActivationEnabled,false);
assert.equal(JSON.stringify(state),before);
assert.equal(projectSeason(JSON.parse(before)).history.length,2);
assert.throws(()=>projectSeason({}),/Invalid isolated season/);
console.log('Experimental season history, standings and GM decision projections passed');
