'use strict';
const assert=require('node:assert/strict');const {alerts}=require('./cpu-audit-alerts');
const base={kind:'cpu-audit-trend',readOnly:true,entries:[{}],delta:{teams:0,players:4,contracts:-1,draftPicks:0,transactions:0,prospects:0},controlledTeamChanged:true,issueCountChange:2};
const a=alerts(base);assert.equal(a.count,4);assert.equal(a.hasReviewItems,true);assert.equal(a.alerts[0].field,'players');assert.ok(Object.isFrozen(a.alerts));
assert.equal(alerts(base,{players:5,contracts:2}).count,2);
assert.throws(()=>alerts({}),/trend/);assert.throws(()=>alerts(base,{players:0}),/threshold/);
assert.equal(alerts({...base,delta:{...base.delta,players:0,contracts:0},controlledTeamChanged:false,issueCountChange:0}).count,0);
console.log('Phase 9 missions 481-495 audit alert tests passed');
