'use strict';
const assert=require('node:assert/strict');
const {estimateShotQuality}=require('./hlm-phase11-shot-quality');
const lineup=Array.from({length:10},(_,i)=>({id:'P'+i,position:i<6?'F':'D',ovr:80}));
const before=JSON.stringify(lineup);
const baseline=estimateShotQuality(lineup,{seed:11});
assert.deepEqual(estimateShotQuality(lineup,{seed:11}),baseline);
assert.equal(JSON.stringify(lineup),before);
assert(baseline.events.every(e=>e.expectedGoalProbability>=0.01&&e.expectedGoalProbability<=0.25));
assert(Math.abs(baseline.expectedGoals-baseline.events.reduce((s,e)=>s+e.expectedGoalProbability,0))<1e-5);
assert.equal(baseline.productionActivationEnabled,false);
assert.equal(baseline.automaticallyApplied,false);
assert.equal(baseline.requiresGMApproval,true);
let forward=0,defense=0,nF=0,nD=0;
for(let seed=0;seed<200;seed++){
 const result=estimateShotQuality(lineup,{seed});
 for(const event of result.events){
  if(Number(event.shooterId.slice(1))<6){forward+=event.expectedGoalProbability;nF++}
  else {defense+=event.expectedGoalProbability;nD++}
 }
}
assert(nF>0&&nD>0&&forward/nF>defense/nD,'forward quality exceeds defense quality');
const high=lineup.map(p=>({...p,ovr:120}));
const low=lineup.map(p=>({...p,ovr:30}));
const highReport=estimateShotQuality(high,{seed:11}),lowReport=estimateShotQuality(low,{seed:11});
assert(highReport.events.length>0&&lowReport.events.length>0);
assert(highReport.events.every(e=>e.expectedGoalProbability>=0.01));
assert(highReport.expectedGoals>lowReport.expectedGoals,'higher ratings increase expected goals for fixed seed');
assert(estimateShotQuality(high,{seed:11}).events.every(e=>e.expectedGoalProbability<=0.25));
assert.throws(()=>estimateShotQuality(lineup,{seed:-1}),TypeError);
console.log('Mission 1125 shot quality bounds, determinism, positional share and isolation passed');
