'use strict';
const assert=require('node:assert/strict');const {record,trend}=require('./cpu-audit-trends');
const base={kind:'cpu-audit-summary',readOnly:true,controlledTeamId:'1',issueCount:2,counts:{teams:1,players:10,contracts:5,draftPicks:2,transactions:0,prospects:3}};
const next={...base,controlledTeamId:'2',issueCount:1,counts:{...base.counts,players:12}};
const result=trend([{summary:base,label:'start'},{summary:next,label:'end'}]);
assert.equal(result.delta.players,2);assert.equal(result.issueCountChange,-1);assert.equal(result.controlledTeamChanged,true);assert.equal(result.entries.length,2);assert.equal(result.readOnly,true);
assert.ok(Object.isFrozen(result.entries));assert.ok(Object.isFrozen(result.entries[0].counts));
assert.equal(trend([]).entries.length,0);assert.throws(()=>record({...base,counts:{...base.counts,players:-1}}),/Invalid count/);assert.throws(()=>trend(new Array(101).fill({summary:base})),/100/);
console.log('Phase 9 missions 466-480 audit trend tests passed');
