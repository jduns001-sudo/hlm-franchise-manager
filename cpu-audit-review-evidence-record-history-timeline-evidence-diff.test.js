'use strict';
const assert=require('node:assert/strict');
const evidence=require('./cpu-audit-review-evidence-record-history-timeline-evidence');
const bundlePresentation=require('./cpu-audit-review-evidence-record-history-timeline-presentation');
const api=require('./cpu-audit-review-evidence-record-history-timeline-evidence-diff');
function item(count,reviewCount,reviewStateChanges){
 const summary={kind:'cpu-audit-public-review-evidence-record-history-timeline-summary',readOnly:true,count,reviewCount,reviewStateChanges,transitionCount:Math.max(0,count-1)};
 return evidence.create({kind:'cpu-audit-public-review-evidence-record-history-timeline-bundle',readOnly:true,summary,text:bundlePresentation.describe(summary)});
}
const before=item(2,0,0),after=item(3,1,1);
const d=api.compare(before,after);
assert.equal(d.reviewChanged,true);
assert.equal(d.snapshotCountDelta,1);
assert.equal(d.reviewCountDelta,1);
assert.equal(d.reviewStateChangesDelta,1);
assert.equal(d.addedReasons.length,2);
assert.equal(d.resolvedReasons.length,0);
assert.ok(Object.isFrozen(d)&&Object.isFrozen(d.addedReasons));
const reverse=api.compare(after,before);
assert.equal(reverse.snapshotCountDelta,-1);
assert.equal(reverse.resolvedReasons.length,2);
assert.equal(api.compare(before,before).reviewChanged,false);
assert.match(api.describe(before,after),/Snapshot delta: 1/);
assert.throws(()=>api.compare({...before,requiresHumanReview:true},after),TypeError);
console.log('Aggregate review evidence record history timeline evidence diff tests passed');
