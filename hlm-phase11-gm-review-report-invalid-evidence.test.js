'use strict';
const assert=require('node:assert/strict');
const {exportGMReviewEvidence}=require('./hlm-phase11-gm-review-evidence-export');
const {validateAndRenderGMReview}=require('./hlm-phase11-gm-review-report-invalid-evidence');
const home=Array.from({length:4},()=>({shots:10,goals:1,expectedGoals:2}));
const away=Array.from({length:4},()=>({shots:8,goals:0,expectedGoals:1}));
const a=exportGMReviewEvidence(home,away,[5,10],[5]);
const b=exportGMReviewEvidence(home,away,[5,10,25],[10]);
const good=validateAndRenderGMReview([{before:a.text,after:b.text}]);
assert.equal(good.accepted,true);assert.equal(good.reason,'review-ready');assert.match(good.page.html,/GM review batch/);
for(const items of [null,[],[null],Array.from({length:51},()=>({before:a.text,after:b.text})),[{before:1,after:b.text}]]){const result=validateAndRenderGMReview(items);assert.equal(result.accepted,false);assert.equal(result.page,null);}
const bad=validateAndRenderGMReview([{before:'{',after:b.text}]);
assert.equal(bad.accepted,false);assert.equal(bad.reason,'invalid-evidence');assert.equal(bad.page,null);
for(const key of ['productionActivationEnabled','gameplayActionAuthorized','saveWriteAllowed'])assert.equal(good[key],false);
assert.equal(good.requiresGMApproval,true);assert.ok(Object.isFrozen(good));
assert.deepEqual(validateAndRenderGMReview([{before:a.text,after:b.text}]),good);
console.log('GM review invalid evidence deterministic tests passed');
