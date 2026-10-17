'use strict';
const assert=require('node:assert/strict');
const {interval,reliability,compare}=require('./hlm-player-performance-reliability');
const g=(goals,assists)=>({shots:4,goals,assists});
const a=[{season:2027,games:[g(1,0),g(0,1),g(0,0)]},{season:2028,games:[g(1,1),g(0,0),g(0,1)]},{season:2029,games:[g(0,0),g(1,0),g(0,0)]}];
const copy=JSON.stringify(a);
assert.equal(interval(0,0).confidence,'insufficient-sample');
assert.equal(interval(1,4).confidence,'limited');
assert.ok(interval(5,20).lower<=.25&&interval(5,20).upper>=.25);
assert.ok(interval(30,30).upper<=1);
assert.throws(()=>interval(3,2),/invalid/);
assert.deepEqual(reliability(a),reliability(a));
assert.equal(reliability(a,{from:2028,to:2029}).rows.length,2);
assert.equal(reliability(a).rows[0].shots,12);
assert.equal(compare(a,a).consistencyDelta,null); // fewer than five games in latest season
assert.equal(compare([],a).comparison,'insufficient-sample');
assert.equal(JSON.stringify(a),copy);
console.log('Mission 1150 sample confidence and deterministic reliability passed');
