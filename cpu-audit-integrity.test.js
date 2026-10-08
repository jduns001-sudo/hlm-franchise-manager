'use strict';
const assert=require('node:assert/strict');const {validateComparison,parseJSON,describe}=require('./cpu-audit-integrity');
const a={kind:'cpu-audit-public-comparison',readOnly:true,changes:{teams:0,players:2,contracts:0,draftPicks:0,transactions:0,prospects:0},issueDelta:-1,hasChanges:false};
const v=parseJSON(JSON.stringify(a));assert.equal(v.hasChanges,true);assert.match(describe(v),/players: \+2/);assert.ok(Object.isFrozen(v.changes));
assert.throws(()=>validateComparison({...a,changes:{...a.changes,players:1.5}}),/delta/);assert.throws(()=>parseJSON('{'),/JSON/);assert.throws(()=>parseJSON('x'.repeat(100001)),/100 KB/);
console.log('Audit integrity tests passed');
