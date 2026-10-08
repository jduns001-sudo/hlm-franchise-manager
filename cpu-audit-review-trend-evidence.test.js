'use strict';
const assert=require('node:assert/strict');
const summary=require('./cpu-audit-summary-bundle');
const evidence=require('./cpu-audit-review-evidence');
const bundles=require('./cpu-audit-review-trend-bundle');
const api=require('./cpu-audit-review-trend-evidence');
const clear={kind:'cpu-audit-public-advisory',readOnly:true,requiresReview:false,changed:false,issueTrend:'unchanged',warnings:[]};
const flagged={...clear,requiresReview:true,changed:true,issueTrend:'increased',warnings:['Data issue count increased']};
const a=evidence.create(summary.build([clear]));
const b=evidence.create(summary.build([flagged]));
for(const entries of [[],[a],[a,b]]){
 const v=api.create(bundles.build(entries));
 assert.deepEqual(api.parse(api.stringify(v)),v);
 assert.ok(Object.isFrozen(v)&&Object.isFrozen(v.reasons));
 assert.throws(()=>api.validate({...v,requiresHumanReview:!v.requiresHumanReview}),TypeError);
 assert.throws(()=>api.validate({...v,reasons:['forged']}),TypeError);
}
assert.throws(()=>api.parse('x'.repeat(1025)),TypeError);
console.log('Aggregate review trend evidence tests passed');
