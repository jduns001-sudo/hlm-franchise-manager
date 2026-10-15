'use strict';
const assert=require('node:assert/strict');
const {buildPerformanceAdvisory}=require('./hlm-phase11-performance-advisory');
const state={meta:{controlledTeamId:1,currentDate:'2026-10-15'},activity:{games:[
{id:'a',date:'2026-10-12',status:'final',homeTeamId:1,awayTeamId:2,homeGoals:1,awayGoals:3},
{id:'b',date:'2026-10-13',status:'final',homeTeamId:2,awayTeamId:1,homeGoals:2,awayGoals:0}
]}};
const original=JSON.stringify(state),result=buildPerformanceAdvisory(state);
assert.equal(result.ownerForm.losses,2);
assert(result.recommendations.some(x=>x.type==='review-line-combinations'));
assert(result.recommendations.every(x=>x.requiresGMApproval&&!x.automaticallyApplied));
assert.equal(result.productionActivationEnabled,false);
assert.equal(JSON.stringify(state),original);
assert.deepEqual(buildPerformanceAdvisory(JSON.parse(original)),result);
console.log('Season performance advisory GM approval and deterministic isolation passed');
