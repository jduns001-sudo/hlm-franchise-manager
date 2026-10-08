'use strict';
const assert=require('node:assert/strict');
const bundles=require('./cpu-audit-summary-bundle');
const evidence=require('./cpu-audit-review-evidence');
const clear={kind:'cpu-audit-public-advisory',readOnly:true,requiresReview:false,changed:false,issueTrend:'unchanged',warnings:[]};
const flagged={...clear,requiresReview:true,changed:true,issueTrend:'increased',warnings:['Data issue count increased']};
for(const reports of [[],[clear],[clear,flagged]]){
 const e=evidence.create(bundles.build(reports));
 assert.deepEqual(evidence.parse(evidence.stringify(e)),e);
 assert.ok(Object.isFrozen(e)&&Object.isFrozen(e.reasons));
 assert.throws(()=>evidence.validate({...e,requiresHumanReview:!e.requiresHumanReview}),TypeError);
 assert.throws(()=>evidence.validate({...e,reasons:['Injected reason']}),TypeError);
}
assert.throws(()=>evidence.parse('x'.repeat(1025)),TypeError);
console.log('Aggregate advisory review evidence tests passed');
