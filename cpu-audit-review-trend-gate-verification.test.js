'use strict';
const assert=require('node:assert/strict');
const summary=require('./cpu-audit-summary-bundle');
const evidence=require('./cpu-audit-review-evidence');
const bundles=require('./cpu-audit-review-trend-bundle');
const gate=require('./cpu-audit-review-trend-gate');
const verification=require('./cpu-audit-review-trend-gate-verification');
const clear={kind:'cpu-audit-public-advisory',readOnly:true,requiresReview:false,changed:false,issueTrend:'unchanged',warnings:[]};
const flagged={...clear,requiresReview:true,changed:true,issueTrend:'increased',warnings:['Data issue count increased']};
const a=evidence.create(summary.build([clear]));
const b=evidence.create(summary.build([flagged]));
for(const input of [bundles.build([]),bundles.build([a]),bundles.build([a,b])]){
 const decision=gate.assess(input);
 assert.deepEqual(verification.verify(input,decision),decision);
 assert.ok(Object.isFrozen(verification.verify(input,decision)));
 for(const tampered of [
  {...decision,requiresHumanReview:!decision.requiresHumanReview},
  {...decision,snapshotCount:decision.snapshotCount+1},
  {...decision,reasons:['forged']},
  {...decision,readOnly:false},
  {...decision,authorization:true},
  {...decision,kind:'other'}
 ])assert.throws(()=>verification.verify(input,tampered),TypeError);
}
assert.throws(()=>verification.verify({...bundles.build([a]),text:'forged'},gate.assess(bundles.build([a]))),TypeError);
console.log('Aggregate review trend gate verification tests passed');
