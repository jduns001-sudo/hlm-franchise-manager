'use strict';
const assert=require('node:assert/strict');const {safeSummary,toJSON,toCSV}=require('./cpu-audit-privacy');
const summary={kind:'cpu-audit-summary',readOnly:true,counts:{teams:1,players:2,contracts:0,draftPicks:0,transactions:0,prospects:0},issueCount:1,issues:['Sensitive player: John Example'],controlledTeamId:'SECRET-TEAM'};
const json=toJSON(summary),csv=toCSV(summary);
assert.ok(!json.includes('John Example'));assert.ok(!json.includes('SECRET-TEAM'));assert.ok(!csv.includes('SECRET-TEAM'));
assert.equal(csv.split('\n')[0],'dataset,count');assert.equal(csv.split('\n').filter(Boolean).length,7);
assert.equal(safeSummary(summary).hasWarnings,true);assert.ok(Object.isFrozen(safeSummary(summary).counts));
assert.throws(()=>safeSummary({}),/summary/);console.log('Audit privacy export tests passed');
