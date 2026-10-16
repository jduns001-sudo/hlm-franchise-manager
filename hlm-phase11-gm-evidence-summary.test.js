'use strict';
const assert=require('node:assert/strict');
const {buildGMEvidenceSummary}=require('./hlm-phase11-gm-evidence-summary');
const state={meta:{controlledTeamId:1,currentDate:'2026-10-15'},activity:{games:[
{id:'a',date:'2026-10-12',status:'final',homeTeamId:1,awayTeamId:2,homeGoals:1,awayGoals:3},
{id:'b',date:'2026-10-13',status:'final',homeTeamId:2,awayTeamId:1,homeGoals:2,awayGoals:0}
]}};
const before=JSON.stringify(state),summary=buildGMEvidenceSummary(state);
assert(summary.totalRecommendations>=1);
assert.equal(summary.reviewReady+summary.needsEvidence,summary.totalRecommendations);
assert(summary.items.every(item=>item.decision==='pending'));
assert.equal(summary.productionActivationEnabled,false);
assert.equal(summary.automaticallyApplied,false);
assert.equal(JSON.stringify(state),before);
assert.deepEqual(buildGMEvidenceSummary(JSON.parse(before)),summary);
console.log('GM evidence summary and production save isolation passed');
