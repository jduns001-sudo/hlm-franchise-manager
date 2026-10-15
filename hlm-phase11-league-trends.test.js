'use strict';
const assert=require('node:assert/strict');
const {projectLeagueTrends}=require('./hlm-phase11-league-trends');
const state={meta:{controlledTeamId:1,currentDate:'2026-10-14'},activity:{games:[
{id:'a',status:'final',date:'2026-10-12',homeTeamId:1,awayTeamId:2,homeGoals:3,awayGoals:1},
{id:'b',status:'final',date:'2026-10-13',homeTeamId:2,awayTeamId:3,homeGoals:2,awayGoals:4},
{id:'c',status:'scheduled',date:'2026-10-15',homeTeamId:1,awayTeamId:3}
]}};
const original=JSON.stringify(state),p=projectLeagueTrends(state);
assert.equal(p.franchiseHistory.length,1);
assert.equal(p.cpuHistory.length,1);
assert.equal(p.teams.find(t=>t.teamId==='1').role,'human-GM');
assert.equal(p.teams.find(t=>t.teamId==='3').lastFive[0].result,'W');
assert.equal(p.productionActivationEnabled,false);
assert.equal(JSON.stringify(state),original);
assert.deepEqual(projectLeagueTrends(JSON.parse(original)),p);
console.log('Owner CPU form and franchise history read-only regression passed');
