'use strict';
const assert=require('node:assert/strict');
const {buildGMEvidenceCoverage}=require('./hlm-phase11-gm-evidence-coverage');
const state={meta:{controlledTeamId:1,currentDate:'2026-10-15'},activity:{games:[
{id:'a',date:'2026-10-12',status:'final',homeTeamId:1,awayTeamId:2,homeGoals:1,awayGoals:3},
{id:'b',date:'2026-10-13',status:'final',homeTeamId:2,awayTeamId:1,homeGoals:2,awayGoals:0}
]}};
const before=JSON.stringify(state),report=buildGMEvidenceCoverage(state);
assert.equal(report.reviewReady+report.awaitingEvidence,report.totalRecommendations);
assert.equal(report.pendingDecisions,report.totalRecommendations);
assert(report.coveragePercent>=0&&report.coveragePercent<=100);
assert.equal(report.productionActivationEnabled,false);
assert.equal(report.requiresGMApproval,true);
assert.equal(report.automaticallyApplied,false);
assert.equal(JSON.stringify(state),before);
assert.deepEqual(buildGMEvidenceCoverage(JSON.parse(before)),report);
console.log('GM evidence coverage, pending decisions and save isolation passed');
