'use strict';
const assert=require('node:assert/strict');
const {exportGMReviewEvidence}=require('./hlm-phase11-gm-review-evidence-export');
const {assessGMReviewEvidenceBoundary}=require('./hlm-phase11-gm-review-evidence-boundary');
const home=Array.from({length:4},()=>({shots:10,goals:1,expectedGoals:2}));
const away=Array.from({length:4},()=>({shots:8,goals:0,expectedGoals:1}));
const a=exportGMReviewEvidence(home,away,[5,10],[5]);
const b=exportGMReviewEvidence(home,away,[5,10,25],[10]);
for(const [before,after,reason,present] of [[a.text,b.text,'human-review-required',true],[a.text,a.text,'no-change',true],['{',b.text,'invalid-evidence',false]]){
 const result=assessGMReviewEvidenceBoundary(before,after);
 assert.equal(result.reason,reason);assert.equal(result.canPresentToGM,present);
 assert.equal(result.gameplayActionAuthorized,false);
 assert.equal(result.productionActivationEnabled,false);
 assert.equal(result.saveWriteAllowed,false);
 assert.equal(result.requiresGMApproval,true);
 assert.ok(Object.isFrozen(result));
 assert.deepEqual(assessGMReviewEvidenceBoundary(before,after),result);
}
console.log('GM review evidence boundary deterministic tests passed');
