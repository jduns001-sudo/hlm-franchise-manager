'use strict';
const assert=require('node:assert/strict');
const evidence=require('./cpu-audit-review-evidence-record-history-evidence');
const presentation=require('./cpu-audit-review-evidence-record-history-presentation');
const bundles=require('./cpu-audit-review-evidence-record-history-timeline-bundle');
const api=require('./cpu-audit-review-evidence-record-history-timeline-evidence');
function record(count,reviewCount,reviewStateChanges){
 const summary={kind:'cpu-audit-public-review-evidence-record-history-summary',readOnly:true,count,reviewCount,reviewStateChanges,transitionCount:Math.max(0,count-1)};
 return evidence.create({kind:'cpu-audit-public-review-evidence-record-history-bundle',readOnly:true,summary,text:presentation.describe(summary)});
}
const a=record(2,0,0),b=record(3,1,1);
const value=api.create(bundles.build([a,b]));
assert.equal(value.requiresHumanReview,true);
assert.equal(value.summary.count,2);
assert.equal(value.reasons.length,2);
assert.ok(Object.isFrozen(value)&&Object.isFrozen(value.reasons));
assert.deepEqual(api.parse(api.stringify(value)),value);
assert.equal(api.create(bundles.build([a,a])).requiresHumanReview,false);
assert.equal(api.create(bundles.build([])).requiresHumanReview,true);
assert.throws(()=>api.validate({...value,requiresHumanReview:false}),TypeError);
assert.throws(()=>api.validate({...value,reasons:['forged']}),TypeError);
assert.throws(()=>api.validate({...value,summary:{...value.summary,count:21}}),TypeError);
assert.throws(()=>api.parse('x'.repeat(1025)),TypeError);
console.log('Aggregate review evidence record history timeline evidence tests passed');
