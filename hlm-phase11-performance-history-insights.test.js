'use strict';
const assert=require('node:assert/strict');
const {summarizePerformanceHistoryInsights,insight}=require('./hlm-phase11-performance-history-insights');
const home=Array.from({length:10},(_,i)=>({id:'H'+i,position:i<6?'F':'D',ovr:85}));
const away=Array.from({length:10},(_,i)=>({id:'A'+i,position:i<6?'F':'D',ovr:75}));
const options={homeGoalie:{id:'HG',ovr:88},awayGoalie:{id:'AG',ovr:78},seed:11,periods:3,gamesPerPeriod:7};
const input=JSON.stringify([home,away,options]);
const r=summarizePerformanceHistoryInsights(home,away,options);
assert.deepEqual(r,summarizePerformanceHistoryInsights(home,away,options));
assert.equal(JSON.stringify([home,away,options]),input);
assert.equal(r.periodCount,3);assert.equal(r.totalGames,21);
assert.equal(r.productionActivationEnabled,false);assert.equal(r.automaticallyApplied,false);assert.equal(r.requiresGMApproval,true);
assert.equal(r.players.length,20);assert.equal(r.comparisons.length,20);
assert.deepEqual(r.comparisons.map(p=>p.rank),Array.from({length:20},(_,i)=>i+1));
assert.equal(new Set(r.comparisons.map(p=>p.team+':'+p.playerId)).size,20);
const sum=(xs,k)=>xs.reduce((n,x)=>n+x[k],0);
for(const side of ['home','away']){
 const t=r.teams[side],members=r.players.filter(p=>p.team===side),rows=members.map(p=>p.insight);
 assert.equal(sum(rows,'shots'),t.insight.shots);
 assert.equal(sum(rows,'goals'),t.insight.goals);
 assert(Math.abs(sum(rows,'expectedGoals')-t.insight.expectedGoals)<.00005);
 for(const p of members){
  assert.equal(p.insight.shots,p.totals.shots);assert.equal(p.insight.goals,p.totals.goals);
  assert.equal(p.insight.descriptiveOnly,true);assert.equal(p.insight.notPredictive,true);
  assert.equal(p.insight.notScoutingGrade,true);
  assert.equal(p.insight.periodCount,3);
 }
}
assert.equal(Object.values(r.persistenceCounts).reduce((a,b)=>a+b,0),20);
const sample=(signal,eligibility='comparable',stabilityScore=55)=>({
 shots:30,goals:2,expectedGoals:1.5,eligibility,trendSignal:signal,
 stabilityScore,observedShootingPercentage:.1,reliabilityTier:'mixed-observed'});
const up='improving-observed',down='declining-observed',flat='no-material-observed-change';
assert.equal(insight([sample(flat),sample(up),sample(up)]).persistentDirectionalSignal,up);
assert.equal(insight([sample(down),sample(down),sample(down)]).latestDirectionalStreak,3);
assert.equal(insight([sample(up),sample(down),sample(down)]).persistentDirectionalSignal,down);
assert.equal(insight([sample(up),sample(flat),sample(up)]).persistentDirectionalSignal,null);
assert.equal(insight([sample(up),sample(up,'provisional'),sample(up)]).persistentDirectionalSignal,null);
assert.equal(insight([sample(flat, 'comparable',50),sample(flat,'comparable',60)]).stabilityDelta,10);
assert.throws(()=>insight([sample(flat)]),RangeError);
assert.notDeepEqual(summarizePerformanceHistoryInsights(home,away,{...options,seed:12}).teams,r.teams);
for(const periods of [0,1,13,1.5])assert.throws(()=>summarizePerformanceHistoryInsights(home,away,{...options,periods}),RangeError);
for(const gamesPerPeriod of [0,31,1.5])assert.throws(()=>summarizePerformanceHistoryInsights(home,away,{...options,gamesPerPeriod}),RangeError);
assert.throws(()=>summarizePerformanceHistoryInsights([...home,home[0]],away,options),/Duplicate player ID/);
console.log('Mission 1145 persistence, tiers, conservation, identities, deterministic replay and safety passed');
