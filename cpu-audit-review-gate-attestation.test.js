'use strict';
const assert=require('node:assert/strict');
const summary=require('./cpu-audit-summary-bundle');
const evidence=require('./cpu-audit-review-evidence');
const bundles=require('./cpu-audit-review-trend-bundle');
const attestation=require('./cpu-audit-review-gate-attestation');
const clear={kind:'cpu-audit-public-advisory',readOnly:true,requiresReview:false,changed:false,issueTrend:'unchanged',warnings:[]};
const flagged={...clear,requiresReview:true,changed:true,issueTrend:'increased',warnings:['Data issue count increased']};
const a=evidence.create(summary.build([clear]));
const b=evidence.create(summary.build([flagged]));
for(const bundle of [bundles.build([]),bundles.build([a]),bundles.build([a,b])]){
 const result=attestation.create(bundle);
 assert.deepEqual(attestation.validate(bundle,result),result);
 assert.ok(Object.isFrozen(result)&&Object.isFrozen(result.reasons));
 for(const forged of [
  {...result,requiresHumanReview:!result.requiresHumanReview},
  {...result,snapshotCount:result.snapshotCount+1},
  {...result,reasons:['fabricated']},
  {...result,readOnly:false},
  {...result,execute:true},
  {...result,kind:'other'}
 ])assert.throws(()=>attestation.validate(bundle,forged),TypeError);
}
assert.throws(()=>attestation.validate(bundles.build([a]),attestation.create(bundles.build([a,b]))),TypeError);
console.log('Review gate attestation tests passed');
