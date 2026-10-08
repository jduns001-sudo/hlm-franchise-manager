'use strict';
const assert=require('node:assert/strict');const {compare,toCSV}=require('./cpu-audit-public-compare');
const a={kind:'cpu-audit-public-summary',readOnly:true,issueCount:1,counts:{teams:1,players:10,contracts:2,draftPicks:0,transactions:0,prospects:0}};
const b={...a,issueCount:0,counts:{...a.counts,players:12}};
const result=compare(a,b);assert.equal(result.changes.players,2);assert.equal(result.issueDelta,-1);assert.equal(result.hasChanges,true);
assert.equal(compare(a,a).hasChanges,false);assert.ok(toCSV(result).includes('players,2'));assert.equal(toCSV(result).split('\n')[0],'dataset,change');
assert.throws(()=>compare({},b),/summaries/);assert.throws(()=>compare(a,{...b,counts:{...b.counts,players:-1}}),/count/);
console.log('Aggregate audit comparison tests passed');
