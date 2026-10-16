'use strict';
const assert=require('node:assert/strict');
const {buildGMEvidenceActionQueue}=require('./hlm-phase11-gm-evidence-action-queue');
const state={meta:{controlledTeamId:1,currentDate:'2026-10-15'},activity:{games:[
{id:'a',date:'2026-10-12',status:'final',homeTeamId:1,awayTeamId:2,homeGoals:1,awayGoals:3},
{id:'b',date:'2026-10-13',status:'final',homeTeamId:2,awayTeamId:1,homeGoals:2,awayGoals:0}
]}};
const before=JSON.stringify(state),result=buildGMEvidenceActionQueue(state);
assert.equal(result.reviewActions+result.evidenceActions,result.totalActions);
assert(result.queue.every(item=>item.requiresGMApproval&&!item.automaticallyApplied&&item.decision==='pending'));
assert.equal(result.productionActivationEnabled,false);
assert.equal(result.advisoryOnly,true);
assert.equal(JSON.stringify(state),before);
assert.deepEqual(buildGMEvidenceActionQueue(JSON.parse(before)),result);
console.log('GM evidence action queue deterministic approval and production isolation regression passed');
