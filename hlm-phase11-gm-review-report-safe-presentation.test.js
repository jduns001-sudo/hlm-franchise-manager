'use strict';
const assert=require('node:assert/strict');
const {exportGMReviewEvidence}=require('./hlm-phase11-gm-review-evidence-export');
const {presentGMReviewSafely}=require('./hlm-phase11-gm-review-report-safe-presentation');
const home=Array.from({length:4},()=>({shots:10,goals:1,expectedGoals:2}));
const away=Array.from({length:4},()=>({shots:8,goals:0,expectedGoals:1}));
const a=exportGMReviewEvidence(home,away,[5,10],[5]);
const b=exportGMReviewEvidence(home,away,[5,10,25],[10]);
const good=presentGMReviewSafely([{before:a.text,after:b.text}]);
assert.equal(good.status,'read-only');assert.equal(good.reason,'human-review-required');
assert.match(good.html,/Human GM approval required/i);
for(const input of [[],null,[{before:'{',after:b.text}]]){const result=presentGMReviewSafely(input);assert.equal(result.status,'unavailable');assert.equal(result.html,null);}
for(const key of ['productionActivationEnabled','gameplayActionAuthorized','saveWriteAllowed'])assert.equal(good[key],false);
assert.equal(good.requiresGMApproval,true);assert.ok(Object.isFrozen(good));
assert.deepEqual(presentGMReviewSafely([{before:a.text,after:b.text}]),good);
console.log('Safe GM review presentation deterministic tests passed');
