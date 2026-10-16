'use strict';
const assert=require('node:assert/strict');
const {buildGMDecisionAudit}=require('./hlm-phase11-gm-decision-audit');
const state={meta:{controlledTeamId:1,currentDate:'2026-10-15'},activity:{games:[
{id:'a',date:'2026-10-12',status:'final',homeTeamId:1,awayTeamId:2,homeGoals:1,awayGoals:3},
{id:'b',date:'2026-10-13',status:'final',homeTeamId:2,awayTeamId:1,homeGoals:2,awayGoals:0}
]}};
const before=JSON.stringify(state),audit=buildGMDecisionAudit(state);
assert(audit.entries.length>=1);
assert(audit.entries.every(x=>x.decision==='pending'&&x.requiresGMApproval&&!x.automaticallyApplied&&x.evidenceGameIds.length===2));
assert.equal(audit.productionActivationEnabled,false);
assert.equal(JSON.stringify(state),before);
assert.deepEqual(buildGMDecisionAudit(JSON.parse(before)),audit);
console.log('GM decision audit isolation and pending authority passed');
