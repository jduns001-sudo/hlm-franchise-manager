'use strict';
const assert=require('node:assert/strict');
const evidence=require('./cpu-audit-review-evidence-record-history-timeline-evidence');
const presentation=require('./cpu-audit-review-evidence-record-history-timeline-presentation');
const bundles=require('./cpu-audit-review-evidence-record-history-timeline-series-bundle');
const api=require('./cpu-audit-review-evidence-record-history-timeline-series-evidence');
function record(count,reviewCount,reviewStateChanges){
 const summary={kind:'cpu-audit-public-review-evidence-record-history-timeline-summary',readOnly:true,count,reviewCount,reviewStateChanges,transitionCount:Math.max(0,count-1)};
 return evidence.create({kind:'cpu-audit-public-review-evidence-record-history-timeline-bundle',readOnly:true,summary,text:presentation.describe(summary)});
}
const a=record(2,0,0),b=record(3,1,1);
const safe=api.create(bundles.build([a,a]));
assert.equal(safe.requiresHumanReview,false);
const flagged=api.create(bundles.build([a,b]));
assert.equal(flagged.requiresHumanReview,true);
assert.equal(flagged.reasons.length,2);
assert.ok(Object.isFrozen(flagged)&&Object.isFrozen(flagged.reasons));
assert.deepEqual(api.parse(api.stringify(flagged)),flagged);
assert.equal(api.create(bundles.build([])).requiresHumanReview,true);
assert.throws(()=>api.validate({...flagged,requiresHumanReview:false}),TypeError);
assert.throws(()=>api.validate({...flagged,reasons:['forged']}),TypeError);
assert.throws(()=>api.validate({...flagged,summary:{...flagged.summary,reviewCount:3}}),TypeError);
assert.throws(()=>api.parse('x'.repeat(1025)),TypeError);
console.log('Aggregate review evidence record history timeline series evidence tests passed');
