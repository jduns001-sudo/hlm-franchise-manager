'use strict';
const assert=require('node:assert/strict');
const {summarizeFinishingConfidence,confidence}=require('./hlm-phase11-finishing-confidence');
const home=Array.from({length:10},(_,i)=>({id:'H'+i,position:i<6?'F':'D',ovr:85}));
const away=Array.from({length:10},(_,i)=>({id:'A'+i,position:i<6?'F':'D',ovr:75}));
const options={homeGoalie:{id:'HG',ovr:88},awayGoalie:{id:'AG',ovr:78},seed:11,games:7};
const input=JSON.stringify([home,away,options]);
const r=summarizeFinishingConfidence(home,away,options);
assert.deepEqual(r,summarizeFinishingConfidence(home,away,options));
assert.equal(JSON.stringify([home,away,options]),input);
assert.equal(r.games,7);
assert.equal(r.productionActivationEnabled,false);assert.equal(r.automaticallyApplied,false);assert.equal(r.requiresGMApproval,true);
const sum=(xs,k)=>xs.reduce((n,x)=>n+x[k],0);
for(const team of ['home','away']){
 const t=r.teams[team],members=r.players.filter(p=>p.team===team);
 for(const part of ['finishingConfidence','earlyConfidence','lateConfidence']){
  const rows=members.map(p=>p[part]),s=t[part];
  assert.equal(sum(rows,'shots'),s.shots);assert.equal(sum(rows,'goals'),s.goals);
  assert(Math.abs(sum(rows,'expectedGoals')-s.expectedGoals)<0.00002);
 }
 for(const p of members){
  const c=p.finishingConfidence;
  assert.equal(c.shots,p.shots);assert.equal(c.goals,p.goals);
  assert.equal(c.expectedGoals,p.expectedGoals);
  assert.equal(c.observedShootingPercentage,c.shots?Number((c.goals/c.shots).toFixed(6)):null);
  assert.equal(c.expectedShootingPercentage,c.shots?Number((c.expectedGoals/c.shots).toFixed(6)):null);
  assert.equal(c.notCalibratedProbability,true);
  assert.equal(p.earlyConfidence.shots+p.lateConfidence.shots,c.shots);
 }
}
assert.equal(confidence({shots:0,goals:0,expectedGoals:0}).confidenceIndicator,'no-shots');
assert.equal(confidence({shots:9,goals:2,expectedGoals:1}).sampleSizeTier,'very-small');
assert.equal(confidence({shots:10,goals:2,expectedGoals:1}).sampleSizeTier,'small');
assert.equal(confidence({shots:29,goals:2,expectedGoals:1}).confidenceIndicator,'limited-sample');
assert.equal(confidence({shots:30,goals:2,expectedGoals:1}).sampleSizeTier,'moderate');
assert.equal(confidence({shots:74,goals:2,expectedGoals:1}).sampleSizeTier,'moderate');
assert.equal(confidence({shots:75,goals:2,expectedGoals:1}).sampleSizeTier,'larger');
assert.equal(confidence({shots:75,goals:2,expectedGoals:1}).confidenceIndicator,'larger-sample');
assert.deepEqual(confidence({shots:1,goals:1,expectedGoals:0.2}).observedInterval95,[0.206543,1]);
assert.equal(confidence({shots:0,goals:0,expectedGoals:0}).expectedWithinObservedInterval,null);
assert.notDeepEqual(summarizeFinishingConfidence(home,away,{...options,seed:12}).teams,r.teams);
assert.throws(()=>summarizeFinishingConfidence(home,away,{games:0}),RangeError);
assert.throws(()=>summarizeFinishingConfidence([...home,home[0]],away,options),/Duplicate player ID/);
let strong=0,weak=0;
for(let seed=0;seed<20;seed++){
 const a=summarizeFinishingConfidence(home,away,{...options,games:6,homeGoalie:{id:'HG',ovr:115},seed});
 const b=summarizeFinishingConfidence(home,away,{...options,games:6,homeGoalie:{id:'HG',ovr:45},seed});
 assert.equal(a.teams.away.shots,b.teams.away.shots);
 strong+=a.teams.away.finishingConfidence.expectedGoals;
 weak+=b.teams.away.finishingConfidence.expectedGoals;
}
assert(strong<weak);
console.log('Mission 1139 sample tiers, Wilson interval, conservation, seeded statistics and isolation passed');
