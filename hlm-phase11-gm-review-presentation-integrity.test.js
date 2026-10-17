'use strict';
const assert=require('node:assert/strict');
const {createHash}=require('node:crypto');
const {exportGMReviewEvidence}=require('./hlm-phase11-gm-review-evidence-export');
const {prepareGMReviewIntegrity}=require('./hlm-phase11-gm-review-presentation-integrity');
const home=Array.from({length:4},()=>({shots:10,goals:1,expectedGoals:2}));
const away=Array.from({length:4},()=>({shots:8,goals:0,expectedGoals:1}));
const a=exportGMReviewEvidence(home,away,[5,10],[5]);
const b=exportGMReviewEvidence(home,away,[5,10,25],[10]);
const report=prepareGMReviewIntegrity([{before:a.text,after:b.text}]);
assert.equal(report.status,'read-only');assert.match(report.sha256,/^[a-f0-9]{64}$/);
assert.equal(report.sha256,createHash('sha256').update(report.html,'utf8').digest('hex'));
assert.deepEqual(prepareGMReviewIntegrity([{before:a.text,after:b.text}]),report);
for(const items of [[],null,[{before:'{',after:b.text}]]){const denied=prepareGMReviewIntegrity(items);assert.equal(denied.status,'unavailable');assert.equal(denied.sha256,null);assert.equal(denied.html,null);}
for(const key of ['productionActivationEnabled','gameplayActionAuthorized','saveWriteAllowed'])assert.equal(report[key],false);
assert.equal(report.requiresGMApproval,true);assert.ok(Object.isFrozen(report));
console.log('GM review presentation integrity deterministic tests passed');
