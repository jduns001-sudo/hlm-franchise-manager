'use strict';
const assert=require('node:assert/strict');
const summaries=require('./cpu-audit-summary-bundle');
const evidence=require('./cpu-audit-review-evidence');
const trends=require('./cpu-audit-review-trend-bundle');
const bundles=require('./cpu-audit-review-attestation-bundle');
const reports=require('./cpu-audit-review-attestation-report');
const clear={kind:'cpu-audit-public-advisory',readOnly:true,requiresReview:false,changed:false,issueTrend:'unchanged',warnings:[]};
const flagged={...clear,requiresReview:true,changed:true,issueTrend:'increased',warnings:['Data issue count increased']};
const a=evidence.create(summaries.build([clear]));
const b=evidence.create(summaries.build([flagged]));
for(const trend of [trends.build([]),trends.build([a]),trends.build([a,b])]){
 const result=reports.create(bundles.create(trend));
 assert.deepEqual(reports.validate(result),result);
 assert.deepEqual(reports.parse(reports.stringify(result)),result);
 assert.ok(Object.isFrozen(result));
 for(const forged of [
  {...result,text:'false approval'},
  {...result,execute:true},
  {...result,readOnly:false},
  {...result,kind:'other'},
  {...result,bundle:{...result.bundle,attestation:{...result.bundle.attestation,requiresHumanReview:!result.bundle.attestation.requiresHumanReview}}}
 ])assert.throws(()=>reports.validate(forged),TypeError);
}
assert.throws(()=>reports.parse('x'.repeat(8193)),TypeError);
console.log('Review attestation report tests passed');
