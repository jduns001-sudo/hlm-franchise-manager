'use strict';
const assert=require('node:assert/strict');
const evidence=require('./cpu-audit-review-evidence-record-history-evidence');
const presentation=require('./cpu-audit-review-evidence-record-history-presentation');
const api=require('./cpu-audit-review-evidence-record-history-timeline');
function record(count,reviewCount,reviewStateChanges){
 const summary={kind:'cpu-audit-public-review-evidence-record-history-summary',readOnly:true,count,reviewCount,reviewStateChanges,transitionCount:Math.max(0,count-1)};
 return evidence.create({kind:'cpu-audit-public-review-evidence-record-history-bundle',readOnly:true,summary,text:presentation.describe(summary)});
}
const a=record(2,0,0),b=record(3,1,1);
const timeline=api.summarize([a,b,a]);
assert.equal(timeline.count,3);
assert.equal(timeline.reviewCount,1);
assert.equal(timeline.reviewStateChanges,2);
assert.equal(timeline.transitions.length,2);
assert.ok(Object.isFrozen(timeline)&&Object.isFrozen(timeline.transitions));
assert.equal(api.summarize([]).count,0);
assert.equal(api.summarize([a]).transitions.length,0);
assert.match(api.describe([a,b]),/Human-review snapshots: 1/);
assert.throws(()=>api.summarize(new Array(21).fill(a)),TypeError);
assert.throws(()=>api.summarize([a,{...b,requiresHumanReview:false}]),TypeError);
assert.throws(()=>api.summarize(null),TypeError);
console.log('Aggregate review evidence record history timeline tests passed');
