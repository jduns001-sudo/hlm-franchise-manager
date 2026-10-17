'use strict';
const assert=require('node:assert/strict');
const {exportGMReviewEvidence}=require('./hlm-phase11-gm-review-evidence-export');
const {MAX_EVIDENCE_CHARS}=require('./hlm-phase11-gm-review-report-batch-limit');
const {probeGMReviewBoundary}=require('./hlm-phase11-gm-review-evidence-boundary-regression');
const home=Array.from({length:4},()=>({shots:10,goals:1,expectedGoals:2}));
const away=Array.from({length:4},()=>({shots:8,goals:0,expectedGoals:1}));
const a=exportGMReviewEvidence(home,away,[5,10],[5]);
const b=exportGMReviewEvidence(home,away,[5,10,25],[10]);
const valid=probeGMReviewBoundary([{before:a.text,after:b.text}]);
assert.equal(valid.accepted,true);assert.equal(valid.hasRenderedPage,true);assert.equal(valid.withinLimit,true);
for(const items of [[],null,[null],[{before:'x'.repeat(MAX_EVIDENCE_CHARS),after:'x'}],[{before:'{',after:b.text}]]){const result=probeGMReviewBoundary(items);assert.equal(result.accepted,false);assert.equal(result.hasRenderedPage,false);}
assert.equal(probeGMReviewBoundary([{before:'x'.repeat(MAX_EVIDENCE_CHARS),after:'x'}]).reason,'evidence-size-limit');
for(const key of ['productionActivationEnabled','gameplayActionAuthorized','saveWriteAllowed'])assert.equal(valid[key],false);
assert.equal(valid.requiresGMApproval,true);assert.ok(Object.isFrozen(valid));
assert.deepEqual(probeGMReviewBoundary([{before:a.text,after:b.text}]),valid);
console.log('GM review evidence boundary probe deterministic tests passed');
