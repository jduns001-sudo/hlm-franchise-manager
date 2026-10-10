'use strict';
const assert=require('node:assert/strict');
const evidence=require('./cpu-audit-review-evidence-record-history-evidence');
const presentation=require('./cpu-audit-review-evidence-record-history-presentation');
const api=require('./cpu-audit-review-evidence-record-history-timeline-export');
function record(count,reviewCount,reviewStateChanges){
 const summary={kind:'cpu-audit-public-review-evidence-record-history-summary',readOnly:true,count,reviewCount,reviewStateChanges,transitionCount:Math.max(0,count-1)};
 return evidence.create({kind:'cpu-audit-public-review-evidence-record-history-bundle',readOnly:true,summary,text:presentation.describe(summary)});
}
const a=record(2,0,0),b=record(3,1,1);
const value=api.create([a,b,a]);
assert.equal(value.count,3);
assert.equal(value.reviewCount,1);
assert.equal(value.reviewStateChanges,2);
assert.equal(value.transitionCount,2);
assert.ok(Object.isFrozen(value));
assert.deepEqual(api.parse(api.stringify(value)),value);
assert.deepEqual(api.parse(api.stringify(api.create([]))),api.create([]));
assert.throws(()=>api.validate({...value,reviewCount:4}),TypeError);
assert.throws(()=>api.validate({...value,transitionCount:1}),TypeError);
assert.throws(()=>api.validate({...value,count:21}),TypeError);
assert.throws(()=>api.parse('x'.repeat(513)),TypeError);
console.log('Aggregate review evidence record history timeline export tests passed');
