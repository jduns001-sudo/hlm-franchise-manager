'use strict';
const assert=require('node:assert/strict');
const {exportGMReviewEvidence}=require('./hlm-phase11-gm-review-evidence-export');
const {assessGMReviewBatch}=require('./hlm-phase11-gm-review-batch-boundary');
const home=Array.from({length:4},()=>({shots:10,goals:1,expectedGoals:2}));
const away=Array.from({length:4},()=>({shots:8,goals:0,expectedGoals:1}));
const a=exportGMReviewEvidence(home,away,[5,10],[5]);
const b=exportGMReviewEvidence(home,away,[5,10,25],[10]);
const changed={before:a.text,after:b.text},unchanged={before:a.text,after:a.text};
const result=assessGMReviewBatch([changed,unchanged]);
assert.deepEqual([result.valid,result.itemCount,result.reviewCount,result.unchangedCount,result.totalChanges,result.reason],[true,2,1,1,3,'human-review-required']);
assert.equal(assessGMReviewBatch([unchanged]).reason,'no-change');
for(const input of [[],null,{},Array.from({length:51},()=>unchanged),[{before:'{',after:b.text}], [{before:a.text,after:7}]]){
 const x=assessGMReviewBatch(input);assert.equal(x.valid,false);assert.equal(x.canPresentToGM,false);assert.equal(x.totalChanges,null);
}
for(const key of ['productionActivationEnabled','gameplayActionAuthorized','saveWriteAllowed'])assert.equal(result[key],false);
assert.equal(result.requiresGMApproval,true);
assert.ok(Object.isFrozen(result));
assert.deepEqual(assessGMReviewBatch([changed,unchanged]),result);
console.log('GM review batch boundary deterministic tests passed');
