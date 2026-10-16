'use strict';
const assert=require('node:assert/strict');
const {buildGMDecisionReadiness}=require('./hlm-phase11-gm-decision-readiness');
const state={meta:{controlledTeamId:1,currentDate:'2026-10-15'},activity:{games:[
{id:'a',date:'2026-10-12',status:'final',homeTeamId:1,awayTeamId:2,homeGoals:1,awayGoals:3},
{id:'b',date:'2026-10-13',status:'final',homeTeamId:2,awayTeamId:1,homeGoals:2,awayGoals:0}
]}};
const before=JSON.stringify(state),report=buildGMDecisionReadiness(state);
assert(report.items.length>=1);
assert(report.items.every(x=>x.readiness==='review-ready'&&x.requiresGMApproval&&x.decision==='pending'&&!x.automaticallyApplied));
assert.equal(report.productionActivationEnabled,false);
assert.equal(JSON.stringify(state),before);
assert.deepEqual(buildGMDecisionReadiness(JSON.parse(before)),report);
console.log('GM decision evidence readiness and save isolation passed');
