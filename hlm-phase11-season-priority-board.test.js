'use strict';
const assert=require('node:assert/strict');
const {buildPriorityBoard}=require('./hlm-phase11-season-priority-board');
const state={meta:{controlledTeamId:1,currentDate:'2026-10-15'},activity:{games:[
{id:'a',date:'2026-10-12',status:'final',homeTeamId:1,awayTeamId:2,homeGoals:0,awayGoals:3},
{id:'b',date:'2026-10-13',status:'final',homeTeamId:2,awayTeamId:1,homeGoals:2,awayGoals:1}
]}};
const before=JSON.stringify(state),board=buildPriorityBoard(state);
assert(board.priorities.length>=1);
assert(board.priorities.every(x=>x.requiresGMApproval&&x.status==='suggested'&&!x.automaticallyApplied));
assert.equal(board.productionActivationEnabled,false);
assert.equal(JSON.stringify(state),before);
assert.deepEqual(buildPriorityBoard(JSON.parse(before)),board);
console.log('Season priority board read-only GM authority regression passed');
