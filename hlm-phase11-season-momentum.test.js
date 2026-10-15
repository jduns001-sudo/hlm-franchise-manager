'use strict';
const assert=require('node:assert/strict');
const {projectMomentum}=require('./hlm-phase11-season-momentum');
const state={meta:{controlledTeamId:1,currentDate:'2026-10-15'},activity:{games:[
{id:'a',date:'2026-10-12',status:'final',homeTeamId:1,awayTeamId:2,homeGoals:3,awayGoals:1},
{id:'b',date:'2026-10-13',status:'final',homeTeamId:2,awayTeamId:1,homeGoals:0,awayGoals:2},
{id:'c',date:'2026-10-16',status:'scheduled',homeTeamId:1,awayTeamId:2}
]}};
const before=JSON.stringify(state),p=projectMomentum(state);
const owner=p.teams.find(t=>t.role==='human-GM');
assert.equal(owner.wins,2);
assert.equal(owner.streak,'W');
assert.equal(owner.streakLength,2);
assert.equal(owner.requiresGMApproval,true);
assert.equal(p.productionActivationEnabled,false);
assert.equal(JSON.stringify(state),before);
assert.deepEqual(projectMomentum(JSON.parse(before)),p);
console.log('Experimental season momentum and GM advisory regression passed');
