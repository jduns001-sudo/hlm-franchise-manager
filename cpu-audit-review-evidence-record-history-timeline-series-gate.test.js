'use strict';
const assert=require('node:assert/strict');
const evidence=require('./cpu-audit-review-evidence-record-history-timeline-evidence');
const presentation=require('./cpu-audit-review-evidence-record-history-timeline-presentation');
const bundles=require('./cpu-audit-review-evidence-record-history-timeline-series-bundle');
const api=require('./cpu-audit-review-evidence-record-history-timeline-series-gate');
function record(count,reviewCount,reviewStateChanges){
 const summary={kind:'cpu-audit-public-review-evidence-record-history-timeline-summary',readOnly:true,count,reviewCount,reviewStateChanges,transitionCount:Math.max(0,count-1)};
 return evidence.create({kind:'cpu-audit-public-review-evidence-record-history-timeline-bundle',readOnly:true,summary,text:presentation.describe(summary)});
}
const a=record(2,0,0),b=record(3,1,1);
const empty=api.assess(bundles.build([]));
assert.equal(empty.requiresHumanReview,true);
assert.equal(empty.reasons.length,1);
const safe=api.assess(bundles.build([a,a]));
assert.equal(safe.requiresHumanReview,false);
const review=api.assess(bundles.build([a,b]));
assert.equal(review.requiresHumanReview,true);
assert.equal(review.reasons.length,2);
assert.equal(review.snapshotCount,2);
assert.ok(Object.isFrozen(review)&&Object.isFrozen(review.reasons));
assert.match(api.describe(bundles.build([a,b])),/human review needed/);
assert.throws(()=>api.assess({...bundles.build([a,b]),text:'forged'}),TypeError);
console.log('Aggregate review evidence record history timeline series gate tests passed');
