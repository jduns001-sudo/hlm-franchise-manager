'use strict';
const assert=require('node:assert/strict');
const {exportGMReviewEvidence}=require('./hlm-phase11-gm-review-evidence-export');
const {validateGMReviewEvidenceExport}=require('./hlm-phase11-gm-evidence-export-validation');
const home=Array.from({length:4},()=>({shots:10,goals:1,expectedGoals:2}));
const away=Array.from({length:4},()=>({shots:8,goals:0,expectedGoals:1}));
const sample=exportGMReviewEvidence(home,away,[5,10],[5]);
assert.equal(validateGMReviewEvidenceExport(sample.text).valid,true);
assert.equal(validateGMReviewEvidenceExport(sample.payload).valid,true);
for(const bad of ['{',null,[],{...sample.payload,productionActivationEnabled:true},{...sample.payload,rows:[{threshold:5,reviewed:true,actionAuthorized:true}]},{...sample.payload,schemaVersion:2}]){
 const r=validateGMReviewEvidenceExport(bad);
 assert.equal(r.valid,false);
 assert.equal(r.saveWriteAllowed,false);
 assert.equal(r.gameplayActionAuthorized,false);
}
assert.deepEqual(validateGMReviewEvidenceExport(sample.text),validateGMReviewEvidenceExport(sample.text));
console.log('GM evidence export validation deterministic tests passed');
