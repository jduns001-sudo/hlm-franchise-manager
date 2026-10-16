'use strict';
const assert=require('node:assert/strict');
const {summarizeShotDanger,tierFor}=require('./hlm-phase11-shot-danger');
const home=Array.from({length:10},(_,i)=>({id:'H'+i,position:i<6?'F':'D',ovr:85}));
const away=Array.from({length:10},(_,i)=>({id:'A'+i,position:i<6?'F':'D',ovr:75}));
const before=JSON.stringify([home,away]);
const opts={homeGoalie:{id:'HG',ovr:88},awayGoalie:{id:'AG',ovr:78},seed:11};
const r=summarizeShotDanger(home,away,opts);
assert.deepEqual(r,summarizeShotDanger(home,away,opts));
assert.equal(JSON.stringify([home,away]),before);
assert.equal(tierFor(0.079999),'low');assert.equal(tierFor(0.08),'medium');
assert.equal(tierFor(0.159999),'medium');assert.equal(tierFor(0.16),'high');
const tiers=['low','medium','high'];
const sum=(o,f)=>tiers.reduce((n,t)=>n+o[t][f],0);
assert.equal(r.periodSummaries.length,3);
for(const team of ['home','away']){
 assert.equal(sum(r.teams[team],'shots'),r[team+'Shots']);
 assert.equal(sum(r.teams[team],'goals'),r[team+'Score']);
 assert(Math.abs(sum(r.teams[team],'expectedGoals')-r[team+'ExpectedGoals'])<0.000005);
 for(const p of r.players.filter(p=>p.team===team)){
  assert.equal(sum(p.tiers,'shots'),p.shots);
  assert.equal(sum(p.tiers,'goals'),p.goals);
  assert(Math.abs(sum(p.tiers,'expectedGoals')-p.expectedGoals)<0.000005);
  assert.equal(p.periodTiers.length,3);
  for(const tier of tiers){
   assert.equal(p.periodTiers.reduce((n,period)=>n+period[tier].shots,0),p.tiers[tier].shots);
   assert.equal(p.periodTiers.reduce((n,period)=>n+period[tier].goals,0),p.tiers[tier].goals);
   assert(Math.abs(p.periodTiers.reduce((n,period)=>n+period[tier].expectedGoals,0)-p.tiers[tier].expectedGoals)<0.000005);
   const d=p.tiers[tier];
   assert.equal(d.shootingPercentage,d.shots?Number((d.goals/d.shots).toFixed(6)):null);
  }
 }
 for(const period of r.periodSummaries){
  assert.equal(sum(period[team+'Tiers'],'shots'),period[team+'Shots']);
  assert.equal(sum(period[team+'Tiers'],'goals'),period[team+'Goals']);
  assert(Math.abs(sum(period[team+'Tiers'],'expectedGoals')-period[team+'ExpectedGoals'])<0.000005);
 }
}
assert.equal(r.productionActivationEnabled,false);assert.equal(r.automaticallyApplied,false);assert.equal(r.requiresGMApproval,true);
assert.throws(()=>summarizeShotDanger([...home,home[0]],away,opts),/Duplicate player ID/);
assert.throws(()=>summarizeShotDanger([{...home[0],id:null},...home.slice(1)],away,opts),/Player ID/);
assert.throws(()=>summarizeShotDanger(home,away,{periods:0}),RangeError);
let strong=0,weak=0;
for(let seed=0;seed<80;seed++){
 const a=summarizeShotDanger(home,away,{...opts,homeGoalie:{id:'HG',ovr:115},seed});
 const b=summarizeShotDanger(home,away,{...opts,homeGoalie:{id:'HG',ovr:45},seed});
 assert.equal(a.awayShots,b.awayShots);
 strong+=a.awayExpectedGoals;weak+=b.awayExpectedGoals;
}
assert(strong<weak);
console.log('Mission 1134 shot danger tier conservation, seeded reproducibility and safety passed');
