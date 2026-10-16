'use strict';
const assert=require('node:assert/strict');
const {summarizeFinishingTrends}=require('./hlm-phase11-finishing-trends');
const home=Array.from({length:10},(_,i)=>({id:'H'+i,position:i<6?'F':'D',ovr:85}));
const away=Array.from({length:10},(_,i)=>({id:'A'+i,position:i<6?'F':'D',ovr:75}));
const original=JSON.stringify([home,away]);
const opts={homeGoalie:{id:'HG',ovr:88},awayGoalie:{id:'AG',ovr:78},seed:11};
const r=summarizeFinishingTrends(home,away,opts);
assert.deepEqual(r,summarizeFinishingTrends(home,away,opts));
assert.equal(JSON.stringify([home,away]),original);
const tiers=['low','medium','high'],sum=(xs,k)=>xs.reduce((n,x)=>n+x[k],0);
for(const team of ['home','away']){
 const players=r.players.filter(p=>p.team===team),t=r.teams[team];
 assert.equal(sum(players,'shots'),t.shots);assert.equal(sum(players,'goals'),t.goals);
 assert(Math.abs(sum(players,'expectedGoals')-t.expectedGoals)<0.000005);
 assert.equal(t.periodTrends.length,3);
 assert.equal(sum(t.periodTrends,'shots'),t.shots);
 assert.equal(sum(t.periodTrends,'goals'),t.goals);
 for(const tier of tiers){
  assert.equal(sum(players.map(p=>p.dangerEfficiency[tier]),'shots'),t.dangerEfficiency[tier].shots);
  assert.equal(sum(players.map(p=>p.dangerEfficiency[tier]),'goals'),t.dangerEfficiency[tier].goals);
 }
 for(const p of players){
  assert.equal(p.periodTrends.length,3);
  assert.equal(sum(p.periodTrends,'shots'),p.shots);
  assert.equal(sum(p.periodTrends,'goals'),p.goals);
  assert.equal(p.shootingPercentage,p.shots?Number((p.goals/p.shots).toFixed(6)):null);
  assert.equal(p.goalsAboveExpected,Number((p.goals-p.expectedGoals).toFixed(6)));
  assert((team==='home'?home:away).some(x=>x.id===p.playerId));
  assert.equal(sum(tiers.map(t=>p.dangerEfficiency[t]),'shots'),p.shots);
  assert.equal(sum(tiers.map(t=>p.dangerEfficiency[t]),'goals'),p.goals);
 }
}
assert.equal(r.productionActivationEnabled,false);
assert.equal(r.automaticallyApplied,false);
assert.equal(r.requiresGMApproval,true);
assert.throws(()=>summarizeFinishingTrends([...home,home[0]],away,opts),/Duplicate player ID/);
assert.throws(()=>summarizeFinishingTrends([{...home[0],id:null},...home.slice(1)],away,opts),/Player ID/);
assert.throws(()=>summarizeFinishingTrends(home,away,{periods:0}),RangeError);
let strong=0,weak=0;
for(let seed=0;seed<80;seed++){
 const a=summarizeFinishingTrends(home,away,{...opts,homeGoalie:{id:'HG',ovr:115},seed});
 const b=summarizeFinishingTrends(home,away,{...opts,homeGoalie:{id:'HG',ovr:45},seed});
 assert.equal(a.teams.away.shots,b.teams.away.shots);
 strong+=a.teams.away.expectedGoals;weak+=b.teams.away.expectedGoals;
}
assert(strong<weak);
console.log('Mission 1135 finishing trends, tier conservation, seeded replay and safety passed');
