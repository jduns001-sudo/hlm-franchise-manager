'use strict';
const assert=require('node:assert/strict');
const summaries=require('./cpu-audit-summary-bundle');
const evidence=require('./cpu-audit-review-evidence');
const bundles=require('./cpu-audit-review-trend-bundle');
const gates=require('./cpu-audit-review-trend-gate');
const checks=require('./cpu-audit-review-trend-verification');
const clear={kind:'cpu-audit-public-advisory',readOnly:true,requiresReview:false,changed:false,issueTrend:'unchanged',warnings:[]};
const flagged={...clear,requiresReview:true,changed:true,issueTrend:'increased',warnings:['Data issue count increased']};
const a=evidence.create(summaries.build([clear]));
const b=evidence.create(summaries.build([flagged]));
for(const entries of [[],[a],[a,b],[a,b,a]]){
 const bundle=bundles.build(entries),gate=gates.assess(bundle);
 const result=checks.verify(bundle,gate);
 assert.equal(result.consistent,true);
 assert.equal(checks.check(bundle).requiresHumanReview,gate.requiresHumanReview);
 assert.ok(Object.isFrozen(result));
 assert.throws(()=>checks.verify(bundle,{...gate,requiresHumanReview:!gate.requiresHumanReview}),TypeError);
 assert.throws(()=>checks.verify(bundle,{...gate,reasons:['forged']}),TypeError);
 assert.throws(()=>checks.verify(bundle,{...gate,snapshotCount:99}),TypeError);
}
console.log('Aggregate review trend gate verification tests passed');
