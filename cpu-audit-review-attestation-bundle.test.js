'use strict';
const assert=require('node:assert/strict');
const summaries=require('./cpu-audit-summary-bundle');
const evidence=require('./cpu-audit-review-evidence');
const trends=require('./cpu-audit-review-trend-bundle');
const bundles=require('./cpu-audit-review-attestation-bundle');
const clear={kind:'cpu-audit-public-advisory',readOnly:true,requiresReview:false,changed:false,issueTrend:'unchanged',warnings:[]};
const flagged={...clear,requiresReview:true,changed:true,issueTrend:'increased',warnings:['Data issue count increased']};
const a=evidence.create(summaries.build([clear]));
const b=evidence.create(summaries.build([flagged]));
for(const input of [trends.build([]),trends.build([a]),trends.build([a,b])]){
 const result=bundles.create(input);
 assert.deepEqual(bundles.validate(result),result);
 assert.deepEqual(bundles.parse(bundles.stringify(result)),result);
 assert.ok(Object.isFrozen(result));
 for(const altered of [
  {...result,readOnly:false},
  {...result,kind:'other'},
  {...result,authorization:true},
  {...result,attestation:{...result.attestation,snapshotCount:99}},
  {...result,attestation:{...result.attestation,reasons:['forged']}}
 ])assert.throws(()=>bundles.validate(altered),TypeError);
}
assert.throws(()=>bundles.parse('not json'),SyntaxError);
assert.throws(()=>bundles.parse('x'.repeat(4097)),TypeError);
console.log('Review attestation bundle tests passed');
