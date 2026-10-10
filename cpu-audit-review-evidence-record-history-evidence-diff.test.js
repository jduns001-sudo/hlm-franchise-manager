'use strict';
const assert=require('node:assert/strict');
const evidence=require('./cpu-audit-review-evidence-record-history-evidence');
const presentation=require('./cpu-audit-review-evidence-record-history-presentation');
const api=require('./cpu-audit-review-evidence-record-history-evidence-diff');
function record(count,reviewCount,reviewStateChanges){
 const summary={kind:'cpu-audit-public-review-evidence-record-history-summary',readOnly:true,count,reviewCount,reviewStateChanges,transitionCount:Math.max(0,count-1)};
 return evidence.create({kind:'cpu-audit-public-review-evidence-record-history-bundle',readOnly:true,summary,text:presentation.describe(summary)});
}
const a=record(2,0,0),b=record(3,1,1);
const diff=api.compare(a,b);
assert.equal(diff.reviewChanged,true);
assert.equal(diff.snapshotCountDelta,1);
assert.equal(diff.reviewCountDelta,1);
assert.equal(diff.reviewStateChangesDelta,1);
assert.equal(diff.addedReasons.length,2);
assert.equal(diff.resolvedReasons.length,0);
assert.ok(Object.isFrozen(diff)&&Object.isFrozen(diff.addedReasons));
const reverse=api.compare(b,a);
assert.equal(reverse.reviewChanged,true);
assert.equal(reverse.resolvedReasons.length,2);
assert.equal(api.compare(a,a).reviewChanged,false);
assert.match(api.describe(a,b),/Snapshot delta: 1/);
assert.throws(()=>api.compare({...a,requiresHumanReview:true},b),TypeError);
console.log('Aggregate review evidence record history comparison tests passed');
