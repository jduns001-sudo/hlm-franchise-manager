'use strict';
const assert=require('node:assert/strict');
const {buildPriorityHistory}=require('./hlm-phase11-gm-priority-history');
const state={meta:{controlledTeamId:1,currentDate:'2026-10-15'},activity:{games:[
{id:'a',date:'2026-10-12',status:'final',homeTeamId:1,awayTeamId:2,homeGoals:1,awayGoals:3},
{id:'b',date:'2026-10-13',status:'final',homeTeamId:2,awayTeamId:1,homeGoals:2,awayGoals:0}
]}};
const before=JSON.stringify(state),p=buildPriorityHistory(state);
assert(p.history.length>=1);
assert(p.history.every(x=>x.humanGMDecision==='pending'&&!x.automaticallyApplied&&x.supportingFinalGames.length===2));
assert.equal(p.productionActivationEnabled,false);
assert.equal(JSON.stringify(state),before);
assert.deepEqual(buildPriorityHistory(JSON.parse(before)),p);
console.log('GM priority provenance and saved history isolation passed');
