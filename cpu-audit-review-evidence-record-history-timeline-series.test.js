'use strict';
const assert=require('node:assert/strict');
const evidence=require('./cpu-audit-review-evidence-record-history-timeline-evidence');
const presentation=require('./cpu-audit-review-evidence-record-history-timeline-presentation');
const api=require('./cpu-audit-review-evidence-record-history-timeline-series');
function item(count,reviewCount,reviewStateChanges){
 const summary={kind:'cpu-audit-public-review-evidence-record-history-timeline-summary',readOnly:true,count,reviewCount,reviewStateChanges,transitionCount:Math.max(0,count-1)};
 return evidence.create({kind:'cpu-audit-public-review-evidence-record-history-timeline-bundle',readOnly:true,summary,text:presentation.describe(summary)});
}
const a=item(2,0,0),b=item(3,1,1);
const s=api.summarize([a,b,a]);
assert.equal(s.count,3);
assert.equal(s.reviewCount,1);
assert.equal(s.reviewStateChanges,2);
assert.equal(s.transitions.length,2);
assert.ok(Object.isFrozen(s)&&Object.isFrozen(s.transitions));
assert.equal(api.summarize([]).count,0);
assert.equal(api.summarize([a]).transitions.length,0);
assert.match(api.describe([a,b]),/Human-review snapshots: 1/);
assert.throws(()=>api.summarize(Array(21).fill(a)),TypeError);
assert.throws(()=>api.summarize('not an array'),TypeError);
assert.throws(()=>api.summarize([{...a,requiresHumanReview:true}]),TypeError);
console.log('Aggregate review evidence record history timeline series tests passed');
