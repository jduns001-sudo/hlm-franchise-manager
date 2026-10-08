'use strict';
const assert=require('node:assert/strict');
const bundles=require('./cpu-audit-summary-bundle');
const gates=require('./cpu-audit-review-gate');
const checks=require('./cpu-audit-review-verification');
const clear={kind:'cpu-audit-public-advisory',readOnly:true,requiresReview:false,changed:false,issueTrend:'unchanged',warnings:[]};
const flagged={...clear,requiresReview:true,changed:true,issueTrend:'increased',warnings:['Data issue count increased']};
for(const input of [[],[clear],[flagged],[clear,flagged]]){
 const bundle=bundles.build(input),gate=gates.assess(bundle);
 assert.equal(checks.verify(bundle,gate).consistent,true);
 assert.equal(checks.check(bundle).requiresHumanReview,gate.requiresHumanReview);
 assert.ok(Object.isFrozen(checks.check(bundle)));
 assert.throws(()=>checks.verify(bundle,{...gate,reasons:['forged']}),TypeError);
 assert.throws(()=>checks.verify(bundle,{...gate,requiresHumanReview:!gate.requiresHumanReview}),TypeError);
}
console.log('Aggregate advisory review consistency tests passed');
