'use strict';
const assert=require('node:assert/strict');const {format}=require('./cpu-audit-presentation');
const counts={teams:1,players:2,contracts:0,draftPicks:0,transactions:0,prospects:0};
const result={kind:'cpu-audit-pipeline',readOnly:true,found:true,summary:{controlledTeamId:'A',counts,issues:['Missing player team'],issueCount:1},trend:{delta:{...counts,teams:0,players:1}},alerts:{count:1,alerts:[{message:'players changed by 1'}]}};
assert.match(format(result,false),/Run the audit again/);assert.doesNotMatch(format(result,false),/Changes since previous audit/);
assert.match(format(result,true),/players: \+1/);assert.match(format(result,true),/Missing player team/);assert.match(format(result,true),/Advisory alerts/);
assert.match(format({kind:'cpu-audit-pipeline',readOnly:true,found:false},false),/No local franchise snapshot/);
assert.throws(()=>format({}),/pipeline/);console.log('Audit presentation tests passed');
